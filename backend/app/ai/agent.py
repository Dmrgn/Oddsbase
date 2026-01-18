"""Agent service for managing Backboard AI integration."""

import os
from backboard import BackboardClient
from typing import AsyncGenerator, Dict, List, Optional

DEBUG_AGENT = os.getenv("DEBUG_AGENT", "").lower() in {"1", "true", "yes"}

class AgentService:
    """
    Manages the Backboard AI Agent lifecycle.
    Handles assistant creation, thread management, and streaming chat.
    """
    
    def __init__(self):
        """Initialize the Backboard client."""
        api_key = os.getenv("BACKBOARD")
        if not api_key:
            raise ValueError("BACKBOARD_API_KEY environment variable is required")
        
        self.client = BackboardClient(api_key=api_key)
        self.assistant_id: Optional[str] = None

    async def initialize(self, assistant_id: Optional[str] = None):
        """
        Ensures an assistant exists for the application.
        
        Args:
            assistant_id: Optional existing assistant ID to reuse
            
        Returns:
            The assistant ID (created or reused)
        """
        if assistant_id:
            # Reuse existing assistant from environment/config
            self.assistant_id = assistant_id
            print(f"[AgentService] Reusing assistant: {assistant_id}")
        else:
            # Create new assistant
            assistant = await self.client.create_assistant(
                name="Dashboard Assistant",
                description="You only respond in poetry."
            )
            self.assistant_id = assistant.assistant_id
            print(f"[AgentService] Created new assistant: {self.assistant_id}")
        
        return self.assistant_id

    async def create_thread(self) -> dict:
        """
        Create a new conversation thread.
        
        Returns:
            Thread object with thread_id
            
        Raises:
            RuntimeError: If assistant is not initialized
        """
        if not self.assistant_id:
            raise RuntimeError("Assistant not initialized. Call initialize() first.")
        
        thread = await self.client.create_thread(self.assistant_id)
        print(f"[AgentService] Created thread: {thread.thread_id}")
        return thread

    async def stream_chat(
        self, 
        thread_id: str, 
        content: str
    ) -> AsyncGenerator[dict, None]:
        """
        Send a message and stream the response.
        
        Args:
            thread_id: The conversation thread ID
            content: User's message content
            
        Yields:
            Streaming response chunks from Backboard
            
        Raises:
            RuntimeError: If assistant is not initialized
        """
        if not self.assistant_id:
            raise RuntimeError("Assistant not initialized. Call initialize() first.")
        
        if DEBUG_AGENT:
            print(f"[AgentService] Streaming message to {thread_id}: {content}")

        async for chunk in await self.client.add_message(
            thread_id=thread_id,
            content=content,
            memory="Auto",  # Enable automatic memory management
            stream=True
        ):
            if DEBUG_AGENT:
                print(f"[AgentService] Stream chunk: {chunk}")
            yield chunk

    async def suggest_params(
        self,
        thread_id: str,
        command_id: str,
        params: List[Dict[str, str]],
        context: str,
        current_params: Optional[Dict[str, str]] = None,
    ) -> Dict:
        """
        Generate parameter suggestions for a command.
        """
        if not self.assistant_id:
            raise RuntimeError("Assistant not initialized. Call initialize() first.")

        prompt = self._build_suggestion_prompt(
            command_id,
            params,
            context,
            current_params,
        )

        if DEBUG_AGENT:
            print(
                "[AgentService] Suggestion prompt for "
                f"{command_id} (thread {thread_id}):\n{prompt}"
            )

        response = await self.client.add_message(
            thread_id=thread_id,
            content=prompt,
            memory="Auto",
            stream=False,
        )

        if DEBUG_AGENT:
            print(f"[AgentService] Raw suggestion response: {response}")

        suggestions = self._parse_suggestions(response, params)

        if DEBUG_AGENT:
            print(f"[AgentService] Parsed suggestions: {suggestions}")

        return suggestions

    def _build_suggestion_prompt(
        self,
        command_id: str,
        params: List[Dict[str, str]],
        context: str,
        current_params: Optional[Dict[str, str]],
    ) -> str:
        param_descriptions = [
            f"- {param['name']} (type: {param['type']})" for param in params
        ]

        current_params_block = ""
        if current_params:
            current_params_block = f"\nCurrent params: {current_params}\n"

        prompt = (
            "Based on the user's command execution history, suggest default "
            f"parameter values for the '{command_id}' command.\n\n"
            "Command Parameters:\n"
            f"{chr(10).join(param_descriptions)}\n\n"
            f"{context}\n"
            f"{current_params_block}"
            "For each parameter, suggest:\n"
            "1. If type is 'market': Provide a list of 2-3 relevant market IDs with "
            "titles and reasoning\n"
            "2. If type is 'text' or 'select': Provide a single suggested value\n\n"
            "Respond in JSON format:\n"
            "{\n"
            "  \"paramName\": {\n"
            "    \"type\": \"market_list\" or \"direct\",\n"
            "    \"value\": \"suggested value\" (for direct type),\n"
            "    \"options\": [\n"
            "      {\"value\": \"market_id\", \"label\": \"Market Title\", "
            "\"reason\": \"Why suggested\"}\n"
            "    ] (for market_list type),\n"
            "    \"reasoning\": \"Brief explanation\"\n"
            "  }\n"
            "}\n\n"
            "Only suggest parameters that have clear relevant history. If no good "
            "suggestions exist, return an empty object {}."
        )

        return prompt

    def _parse_suggestions(
        self,
        response: Dict,
        params: List[Dict[str, str]],
    ) -> Dict:
        import json

        try:
            content = response.get("content", "")

            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                content = content[start:end].strip()
            elif "```" in content:
                start = content.find("```") + 3
                end = content.find("```", start)
                content = content[start:end].strip()

            suggestions = json.loads(content)

            validated_suggestions = {}
            for param_name, suggestion in suggestions.items():
                if suggestion.get("type") in ["direct", "market_list"]:
                    validated_suggestions[param_name] = suggestion

            return validated_suggestions
        except Exception as error:
            print(f"[AgentService] Failed to parse suggestions: {error}")
            return {}
