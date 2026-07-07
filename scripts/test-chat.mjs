import { writeFileSync } from "fs";

fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "hilo" }],
    model: "gemini",
  }),
})
  .then((r) => r.json())
  .then((d) => {
    writeFileSync("chat-test-result.json", JSON.stringify(d, null, 2));
    console.log(d.response);
    console.log("isSimulated:", d.stats?.isSimulated);
  })
  .catch((e) => console.error(e));
