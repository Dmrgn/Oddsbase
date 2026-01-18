from __future__ import annotations

from collections import deque
from datetime import datetime
from typing import Dict, List, Optional
import json


class CommandExecution:
    """Represents a single command execution."""

    def __init__(self, command_id: str, params: Dict[str, str], timestamp: str):
        self.command_id = command_id
        self.params = params
        self.timestamp = timestamp

    def to_dict(self) -> dict:
        return {
            "command_id": self.command_id,
            "params": self.params,
            "timestamp": self.timestamp,
        }


class CommandHistoryManager:
    """
    Manages command execution history per WebSocket connection.
    Maintains a circular buffer of recent executions for context.
    """

    def __init__(self, max_size: int = 50):
        self.max_size = max_size
        self.history: deque[CommandExecution] = deque(maxlen=max_size)

    def track_execution(
        self,
        command_id: str,
        params: Dict[str, str],
        timestamp: Optional[str] = None,
    ) -> None:
        if not timestamp:
            timestamp = datetime.utcnow().isoformat() + "Z"

        execution = CommandExecution(command_id, params, timestamp)
        self.history.append(execution)
        print(f"[CommandHistory] Tracked: {command_id} (total: {len(self.history)})")

    def get_recent_executions(
        self,
        limit: Optional[int] = None,
        command_id: Optional[str] = None,
    ) -> List[CommandExecution]:
        filtered = list(self.history)

        if command_id:
            filtered = [execution for execution in filtered if execution.command_id == command_id]

        filtered.reverse()

        if limit:
            filtered = filtered[:limit]

        return filtered

    def build_context_string(self, command_id: str, limit: int = 10) -> str:
        recent = self.get_recent_executions(limit=limit)

        if not recent:
            return "No command execution history available."

        lines = ["Recent command executions:"]

        for index, execution in enumerate(recent, 1):
            params_str = json.dumps(execution.params)
            lines.append(
                f"{index}. {execution.command_id} - {params_str} ({execution.timestamp})"
            )

        same_command = [execution for execution in recent if execution.command_id == command_id]
        if same_command:
            lines.append(f"\nPrevious executions of '{command_id}':")
            for index, execution in enumerate(same_command[:5], 1):
                params_str = json.dumps(execution.params)
                lines.append(f"  {index}. {params_str} ({execution.timestamp})")

        return "\n".join(lines)

    def get_statistics(self) -> Dict:
        command_counts: Dict[str, int] = {}
        param_frequencies: Dict[str, Dict[str, int]] = {}

        for execution in self.history:
            command_counts[execution.command_id] = command_counts.get(execution.command_id, 0) + 1

            for param_name, param_value in execution.params.items():
                if param_name not in param_frequencies:
                    param_frequencies[param_name] = {}

                param_frequencies[param_name][param_value] = (
                    param_frequencies[param_name].get(param_value, 0) + 1
                )

        return {
            "total_executions": len(self.history),
            "command_counts": command_counts,
            "param_frequencies": param_frequencies,
        }
