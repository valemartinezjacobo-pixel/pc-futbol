// Puente (proxy) para API-Football. Se ejecuta en el servidor de Netlify,
// así el navegador no choca con el bloqueo CORS al actualizar plantillas.
// La clave del usuario llega en la cabecera x-apisports-key y NO se guarda.
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "x-apisports-key, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };

  const q = event.queryStringParameters || {};
  const h = event.headers || {};
  const path = q.path || "";
  const key = ((h["x-apisports-key"] || h["X-Apisports-Key"] || q.key || "") + "").trim();
  const json = (code, obj) => ({ statusCode: code, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(obj) });

  if (!path) return json(400, { error: "Falta el parametro 'path'." });
  if (!key) return json(400, { error: "Falta la clave (cabecera x-apisports-key)." });
  // Seguridad basica: solo dejamos pasar rutas de la API de futbol
  if (!/^\/[a-z0-9/_?=&.-]+$/i.test(path)) return json(400, { error: "Ruta no permitida." });

  try {
    const resp = await fetch("https://v3.football.api-sports.io" + path, {
      headers: { "x-apisports-key": key },
    });
    const body = await resp.text();
    return { statusCode: resp.status, headers: { ...cors, "content-type": "application/json" }, body };
  } catch (e) {
    return json(502, { error: "Puente: " + (e && e.message ? e.message : "fallo de red") });
  }
};
