export function entitiesToHTML(text, entities = []) {
  // Escape special characters and map original positions to escaped positions
  let escaped = "";
  const map = [];
  for (let i = 0; i < text.length; i++) {
    map[i] = escaped.length;
    const ch = text[i];
    switch (ch) {
      case "&":
        escaped += "&amp;";
        break;
      case "<":
        escaped += "&lt;";
        break;
      case ">":
        escaped += "&gt;";
        break;
      case '"':
        escaped += "&quot;";
        break;
      case "'":
        escaped += "&#39;";
        break;
      default:
        escaped += ch;
    }
  }
  map[text.length] = escaped.length;

  if (!entities || entities.length === 0) return escaped;

  const inserts = [];
  for (const ent of entities) {
    let openTag = "", closeTag = "";
    switch (ent.type) {
      case "bold":
        openTag = "<b>";
        closeTag = "</b>";
        break;
      case "italic":
        openTag = "<i>";
        closeTag = "</i>";
        break;
      case "underline":
        openTag = "<u>";
        closeTag = "</u>";
        break;
      case "strikethrough":
        openTag = "<s>";
        closeTag = "</s>";
        break;
      case "code":
        openTag = "<code>";
        closeTag = "</code>";
        break;
      case "pre":
        openTag = "<pre>";
        closeTag = "</pre>";
        break;
      case "text_link":
        openTag = `<a href="${ent.url}" target="_blank">`;
        closeTag = "</a>";
        break;
      case "text_mention":
        openTag = `<a href="tg://user?id=${ent.user.id}">`;
        closeTag = "</a>";
        break;
    }
    inserts.push({ pos: map[ent.offset], tag: openTag, order: 1 });
    inserts.push({ pos: map[ent.offset + ent.length], tag: closeTag, order: 0 });
  }

  // Sort: descending pos, closing tags first at same position
  inserts.sort((a, b) => b.pos - a.pos || a.order - b.order);

  // Insert backwards so offsets remain valid
  let result = escaped;
  for (const ins of inserts) {
    result = result.slice(0, ins.pos) + ins.tag + result.slice(ins.pos);
  }

  return result;
}
