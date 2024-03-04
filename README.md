# Chatbot Interface for VS Code Extension README

## Introduction
This README document outlines the setup and usage of the Chatbot Interface VS Code Extension. This extension enables a powerful chatbot interface within the Visual Studio Code environment, allowing developers to interact with AI models directly from their editor. The chatbot can assist with coding questions, explanations, and much more, integrating seamlessly with various AI services.

## Features
- **Customizable AI Endpoint**: Connect to any AI service that accepts and responds in a compatible format with OpenAI's API.
- **Flexible Configuration**: Set up the extension with your API key, preferred model, and interaction settings to tailor the chatbot's responses to your needs.
- **Enhanced Request Option**: Toggle the enhanced request feature to include additional request metadata, compatible with advanced endpoint configurations.
- **Integrated Chat Interface**: Access the chatbot directly within VS Code, allowing for real-time interaction without leaving your development environment.
- **Code Context Awareness**: Automatically includes selected code in your queries, enabling context-specific assistance from the chatbot.

## Extension Settings
To configure the Chatbot Interface for your development needs, navigate to the extension settings within VS Code. The easiest way to find these settings is to search for `chatbotextension` in the settings menu. The following options are available for customization:

1. **Endpoint**: Specify the endpoint URL to which the chatbot requests will be sent.
2. **API Key**: Enter the API key required for authenticating with your chosen AI service.
3. **Temperature**: Adjust the response generation temperature to control the variability of the chatbot's replies.
4. **Model**: Select the model you wish to use for generating responses.
5. **Enhanced Request**: Toggle this option to `false` when using OpenAI endpoints. This affects the request format sent to the service.

### Request Formats
Depending on the `Enhanced Request` setting, the request body sent to the AI service will vary:

- **Standard Request (Enhanced Request = false)**
```json
{
  "model": "given model",
  "messages": [
    {"role": "assistant", "content": "I am your helpful assistant!"},
    {"role": "user", "content": "a user prompt"}
  ],
  "temperature": 0.7
}
```

- **Enhanced Request (Enhanced Request = true)**
```json
{
  "model": "given model",
  "messages": [
    {"role": "assistant", "content": "I am your helpful assistant!", "id": "80129c16-d42f-4131-a858-896e50eea248", "date": "14:34"},
    {"role": "user", "content": "a user prompt", "id": "170ae6a7-4f73-46a1-ac7c-148849952667", "date": "14:34"}
  ],
  "temperature": 0.7,
  "conversation_id": "87e29190-48fb-4ddf-8b14-a34c57d46333"
}
```

### Expected Response Format
The AI service should respond with a JSON body, where the reply text can be found at the path `data["choices"][0]["message"]["content"]`. This is the standard OpenAI layout to allow directly including ChatGPT.

## Usage
To open the chatbot interface within VS Code:

1. Press `Cmd` + `Shift` + `P` (Mac) or `Ctrl` + `Shift` + `P` (Windows/Linux) to open the command palette.
2. Type `Open Chatbot` and select the command to launch the chatbot interface.

### Chat Interface Features
- **Sending Messages**: Type your message and press `Enter` to send. Use `Shift` + `Enter` for inserting a new line.
- **Theme Switching**: Toggle between dark and light themes using the button in the upper right corner.
- **New Chat Session**: Open a new chat session from the interface. Note that chats are not persisted within the system currently.
- **Code Context**: Any selected code in the editor will be included automatically in your next question, enhancing the chatbot's ability to provide relevant assistance.

Enjoy integrating this powerful chatbot interface into your development workflow, enhancing your productivity and coding efficiency.



