import os

chatbot_path = r"c:\Users\makin\Downloads\vonoa-chatbot.html"
index_path = r"c:\Users\makin\Downloads\VonoaWeb Design System (5)\site\index.html"

with open(chatbot_path, "r", encoding="utf-8") as f:
    chatbot_lines = f.readlines()

# Extract lines 8 to 446 (0-indexed: 7 to 446)
chatbot_content = "".join(chatbot_lines[7:446])

with open(index_path, "r", encoding="utf-8") as f:
    index_content = f.read()

# Find the WhatsApp block
start_marker = "<!-- ======= WHATSAPP FLOTANTE ======= -->"
end_marker = "</a>\n"
start_idx = index_content.find(start_marker)
end_idx = index_content.find(end_marker, start_idx) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    new_index_content = index_content[:start_idx] + "<!-- ======= CHATBOT IA ======= -->\n" + chatbot_content + "\n" + index_content[end_idx:]
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(new_index_content)
    print("Chatbot successfully integrated!")
else:
    print("WhatsApp marker not found.")
