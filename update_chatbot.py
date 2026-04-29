import os

chatbot_path = r"c:\Users\makin\Downloads\vonoa-chatbot.html"
index_path = r"c:\Users\makin\Downloads\VonoaWeb Design System (5)\site\index.html"

with open(chatbot_path, "r", encoding="utf-8") as f:
    chatbot_lines = f.readlines()

# Extract lines 8 to 446 (0-indexed: 7 to 446)
chatbot_content = "".join(chatbot_lines[7:446])

with open(index_path, "r", encoding="utf-8") as f:
    index_content = f.read()

# Find the Chatbot block
start_marker = "<!-- ======= CHATBOT IA ======= -->"
end_marker = "</a>\n" # Actually the previous script replaced it up to </a>. But the chatbot ends with </script>. Wait, let me just find <!-- ======= CHATBOT IA ======= --> and then </script>
start_idx = index_content.find(start_marker)

# Because the chatbot ends with </script> and the old whatsapp ended with </a>, let's find the closing </script> after the marker
if start_idx != -1:
    end_script_idx = index_content.find("</script>", start_idx + len(start_marker))
    if end_script_idx != -1:
        end_idx = end_script_idx + len("</script>")
        new_index_content = index_content[:start_idx] + "<!-- ======= CHATBOT IA ======= -->\n" + chatbot_content + index_content[end_idx:]
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_index_content)
        print("Chatbot successfully updated in index.html!")
    else:
        print("End of chatbot not found.")
else:
    print("Chatbot marker not found.")
