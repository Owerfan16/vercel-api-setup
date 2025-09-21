module.exports = async function handler(req, res) {
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
    const fieldsCheckResponse = await fetch(
      `https://${DOMAIN}.amocrm.ru/api/v4/leads/custom_fields?with=values,enums&limit=250`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    let availableFields = [];
    if (fieldsCheckResponse.ok) {
      const fieldsData = await fieldsCheckResponse.json();
      availableFields = fieldsData._embedded?.custom_fields || [];
      console.log(`✅ Найдено ${availableFields.length} полей в amoCRM`);
    } else {
      console.log(
        "⚠️ Не удалось получить список полей, используем стандартные ID"
      );
    }

    // Проверяем, какие из наших полей доступны
    const ourFieldIds = [
      1274195, 1274197, 1274209, 1274207, 1274203, 1274211, 1274213, 1274215,
    ];
    const availableFieldIds = availableFields.map((f) => f.id);
    const missingFields = ourFieldIds.filter(
      (id) => !availableFieldIds.includes(id)
    );
    const foundFields = ourFieldIds.filter((id) =>
      availableFieldIds.includes(id)
    );

    console.log(`📊 Анализ полей:`);
    console.log(`- Найдено: ${foundFields.length}/${ourFieldIds.length}`);
    console.log(`- Отсутствуют: ${missingFields.join(", ")}`);

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

    // Создаем массив полей только для доступных полей
    const customFieldsValues = [];

    // Добавляем только те поля, которые найдены в amoCRM и имеют значения
    if (foundFields.includes(1274195) && body.propertyType.length > 0) {
      customFieldsValues.push({
        field_id: 1274195,
        values: body.propertyType.map((value) => ({ value })),
      });
    }

    if (foundFields.includes(1274197) && body.district.length > 0) {
      customFieldsValues.push({
        field_id: 1274197,
        values: body.district.map((value) => ({ value })),
      });
    }

    if (foundFields.includes(1274209) && body.rooms.length > 0) {
      customFieldsValues.push({
        field_id: 1274209,
        values: body.rooms.map((value) => ({ value })),
      });
    }

    if (foundFields.includes(1274207) && body.timeline) {
      customFieldsValues.push({
        field_id: 1274207,
        values: [{ value: body.timeline }],
      });
    }

    if (foundFields.includes(1274203) && body.budget) {
      customFieldsValues.push({
        field_id: 1274203,
        values: [{ value: body.budget }],
      });
    }

    if (foundFields.includes(1274211) && body.contactMethod.length > 0) {
      customFieldsValues.push({
        field_id: 1274211,
        values: body.contactMethod.map((value) => ({ value })),
      });
    }

    if (foundFields.includes(1274213)) {
      customFieldsValues.push({
        field_id: 1274213,
        values: [{ value: body.phone }],
      });
    }

    if (foundFields.includes(1274215) && body.email) {
      customFieldsValues.push({
        field_id: 1274215,
        values: [{ value: body.email }],
      });
    }

    // Создаем сделку с доступными полями
    const leadData = [
      {
        name: `Заявка с сайта от ${new Date().toLocaleDateString()}`,
        pipeline_id: parseInt(PIPELINE_ID),
        custom_fields_values: customFieldsValues,
      },
    ];

    console.log(
      "Отправляем данные в amoCRM:",
      JSON.stringify(leadData, null, 2)
    );

    const leadResponse = await fetch(
      `https://${DOMAIN}.amocrm.ru/api/v4/leads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      }
    );

    if (!leadResponse.ok) {
      const errorText = await leadResponse.text();
      console.error("Ошибка amoCRM:", errorText);
      throw new Error(
        `Ошибка при создании сделки: ${leadResponse.status} - ${errorText}`
      );
    }

    const leadResult = await leadResponse.json();
    console.log("Сделка создана:", leadResult);
    const leadId = leadResult._embedded.leads[0].id;

    // Добавляем примечание к сделке
    const noteData = [
      {
        entity_id: leadId,
        note_type: "common",
        params: {
          text: noteText,
        },
      },
    ];

    console.log("Добавляем примечание:", noteText);

    const noteResponse = await fetch(
      `https://${DOMAIN}.amocrm.ru/api/v4/leads/notes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      }
    );

    if (!noteResponse.ok) {
      const errorText = await noteResponse.text();
      console.error("Ошибка при добавлении примечания:", errorText);
      // Не прерываем выполнение, так как сделка уже создана
    } else {
      console.log("Примечание добавлено успешно");
    }

    res.status(200).json({
      success: true,
      leadId: leadId,
      message: "Заявка успешно отправлена в amoCRM",
      fieldsUsed: foundFields,
      fieldsMissing: missingFields,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
