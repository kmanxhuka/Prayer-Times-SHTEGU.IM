import assert from "assert";
import { entitiesToHTML } from "./entitiesToHTML.js";

// Plain text escaping
assert.strictEqual(
  entitiesToHTML("2 < 3 > 1 & \"quote\" 'test'"),
  "2 &lt; 3 &gt; 1 &amp; &quot;quote&quot; &#39;test&#39;"
);

// Text with entity around characters next to < and >
const text = "<tag>";
const entities = [{ type: "bold", offset: 1, length: 3 }];
assert.strictEqual(
  entitiesToHTML(text, entities),
  "&lt;<b>tag</b>&gt;"
);

console.log("entitiesToHTML tests passed");
