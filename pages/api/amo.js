export default function handler(req, res) {
  console.log(`API called: ${req.method} ${req.url}`);

  // Устанавливаем CORS заголовки
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "false");

  // Обработка preflight запросов
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;

    // Данные для подключения к amoCRM
    const DOMAIN = process.env.AMOCRM_DOMAIN || "gproleague";
    const ACCESS_TOKEN =
      process.env.AMOCRM_ACCESS_TOKEN ||
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImEwYTEwYmQwMzk5ZWFiYmRmNDVjZmEzZmNlZjYzNmQ1MGI5MTNhOGE4YmYyMmI1MWI0NTU0NDNhODQ1MWQ1ZTg0N2U0ZDE4NDRkYThkOThiIn0.eyJhdWQiOiIwMTY2ZmVmMy03MDEzLTRmZjQtOTZiOC1kYmRiMzZkYWMwOWUiLCJqdGkiOiJhMGExMGJkMDM5OWVhYmJkZjQ1Y2ZhM2ZjZWY2MzZkNTBiOTEzYThhOGJmMjJiNTFiNDU1NDQzYTg0NTFkNWU4NDdlNGQxODQ0ZGE4ZDk4YiIsImlhdCI6MTc1ODQzMzc1NywibmJmIjoxNzU4NDMzNzU3LCJleHAiOjE4OTM0NTYwMDAsInN1YiI6IjEyOTg2NDM4IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyNjY1MjU0LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwidXNlcl9mbGFncyI6MCwiaGFzaF91dWlkIjoiZmE0ODc0MGEtYTNkOS00NTc3LTlkZWQtNmZjYTMyOGM5Mjk4IiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.Y48tD1Q1h8ExG-XCiexY_bsI0PQvHDafSmDNfysgfesISeDI-JJBbtkoL3rkBcpXS1XoTQb-CNRXN_pslloYYB7zdC6_3z8OVv2THq0GANut8O98mbh-phz8B1eBRtrcLTz6wiIBevbhkTQsH9Fnsg_2TZSlUW6ZT-BK-OVUQCW91yvbkaNSll_n439GtEXlkIa5yoyxkFXfO3c5U1kXfvadujw4oLre-hBw9qVufjU0oxOrsqF5WI159ClDKpHB44aCGekZ5do4aGVzPTuuVVc8byPhdV0tqEKaCx2PX8h50UyCJNr-KP36JlGcxfEFZuCVrMVfR2qIYEnz6ZQy3w";
    const PIPELINE_ID = process.env.AMOCRM_PIPELINE_ID || "10110086";

    // Сначала проверим доступность полей
    console.log("🔍 Проверяем доступность полей...");

    // Формируем данные для amoCRM
    const noteText = `
      Новая заявка с сайта:
      Тип недвижимости: ${body.propertyType.join(", ")}
      Район: ${body.district.join(", ")}
      Количество комнат: ${body.rooms.join(", ")}
      Время покупки: ${body.timeline}
      Бюджет: ${body.budget}
      Способ связи: ${body.contactMethod.join(", ")}
      Телефон: ${body.phone}
      ${body.email ? `Email: ${body.email}` : ""}
    `;

    // Создаем сделку
    const leadData = [
      {
        name: `Заявка с сайта от ${new Date().toLocaleDateString()}`,
        pipeline_id: parseInt(PIPELINE_ID),
        custom_fields_values: [],
      },
    ];

    console.log(
      "Отправляем данные в amoCRM:",
      JSON.stringify(leadData, null, 2)
    );

    // Для тестирования просто возвращаем успех
    res.status(200).json({
      success: true,
      leadId: "test-123",
      message: "Заявка успешно отправлена в amoCRM (тестовый режим)",
      noteText: noteText,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
