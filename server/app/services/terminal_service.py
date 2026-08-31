import asyncio
import os
import re
from typing import Dict, Any, Tuple, Optional
from pathlib import Path
from ..config import WORKSPACE_DIR

BLOCKED_PATTERNS = [
    r"rmdir\s+/[sS]\s+/[qQ]\s+[cC]:\\?",
    r"del\s+/[sS]\s+/[qQ]\s+[cC]:\\?",
    r"format\s+[cC]:",
    r"diskpart",
    r"bcdedit",
    r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;",
    r"shutdown\s+/[sSrR]",
]

class TerminalService:
    def __init__(self):
        self.active_processes: Dict[str, asyncio.subprocess.Process] = {}

    def is_command_safe(self, command: str) -> Tuple[bool, str]:
        cmd_lower = command.lower()
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, cmd_lower):
                return False, f"Command rejected: matches dangerous pattern '{pattern}'"
        return True, "Safe"

    async def execute_command(
        self,
        command: str,
        cwd: Optional[str] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        is_safe, reason = self.is_command_safe(command)
        if not is_safe:
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": reason,
                "timed_out": False,
                "command": command
            }

        target_cwd = Path(cwd) if cwd else WORKSPACE_DIR
        target_cwd.mkdir(parents=True, exist_ok=True)

        try:
            process = await asyncio.create_subprocess_exec(
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                command,
                cwd=str(target_cwd),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                stdout_data, stderr_data = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
                stdout = stdout_data.decode("utf-8", errors="replace")
                stderr = stderr_data.decode("utf-8", errors="replace")
                exit_code = process.returncode or 0

                return {
                    "exit_code": exit_code,
                    "stdout": stdout,
                    "stderr": stderr,
                    "timed_out": False,
                    "command": command,
                    "cwd": str(target_cwd)
                }

            except asyncio.TimeoutError:
                try:
                    process.kill()
                except Exception:
                    pass
                return {
                    "exit_code": -1,
                    "stdout": "",
                    "stderr": f"Command timed out after {timeout} seconds.",
                    "timed_out": True,
                    "command": command,
                    "cwd": str(target_cwd)
                }

        except Exception as e:
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "timed_out": False,
                "command": command,
                "cwd": str(target_cwd)
            }

terminal_service = TerminalService()
