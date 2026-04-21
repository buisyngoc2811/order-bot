require("dotenv").config();
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Web server chạy");
});
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  WebhookClient
} = require("discord.js");

// ===== PRICE =====
const PRICE_LIST = {
  youtube: { "1m": 40000, "3m": 120000, "6m": 230000, "12m": 350000 },
  spotify: { "4m": 100000, "12m": 340000 },
  chatgpt: { "1m": 90000, "fam": 119000 },
  netflix: { "3m": 220000, "6m": 320000, "12m": 620000 }
};

const PRODUCT_NAME = {
  youtube: "📺 YouTube Premium",
  spotify: "🎧 Spotify Premium",
  chatgpt: "🤖 ChatGPT Plus",
  netflix: "🎬 Netflix"
};

const PLAN_NAME = {
  "1m": "1 Tháng",
  "3m": "3 Tháng",
  "6m": "6 Tháng",
  "12m": "1 Năm",
  "4m": "4 Tháng",
  "fam": "Family"
};

const PLAN_TIME = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "12m": 365,
  "4m": 120,
  "fam": 30
};

const webhook = new WebhookClient({
   url: process.env.WEBHOOK_URL
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", () => {
  console.log(`🔥 ${client.user.tag} đã online`);
});

// ===== COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName("order")
    .setDescription("Tạo đơn hàng")
    .addUserOption(o => o.setName("user").setDescription("Khách").setRequired(true))
    .addStringOption(o =>
      o.setName("product")
        .setDescription("Sản phẩm")
        .setRequired(true)
        .addChoices(
          { name: "📺 Youtube Premium", value: "youtube" },
          { name: "🎧 Spotify Premium", value: "spotify" },
          { name: "🤖 ChatGPT Plus", value: "chatgpt" },
          { name: "🎬 Netflix", value: "netflix" }
        )
    )
    .addStringOption(o =>
      o.setName("plan")
        .setDescription("Gói")
        .setRequired(true)
        .addChoices(
          { name: "1 Tháng", value: "1m" },
          { name: "3 Tháng", value: "3m" },
          { name: "6 Tháng", value: "6m" },
          { name: "1 Năm", value: "12m" },
          { name: "4 Tháng", value: "4m" },
          { name: "Family", value: "fam" }
        )
    ),
  new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Gửi feedback")
    .addStringOption(o => o.setName("content").setDescription("Nội dung").setRequired(true))
    .addIntegerOption(o =>
      o.setName("star")
        .setDescription("Số sao")
        .setRequired(true)
        .addChoices(
          { name: "⭐ 1 sao", value: 1 },
          { name: "⭐⭐ 2 sao", value: 2 },
          { name: "⭐⭐⭐ 3 sao", value: 3 },
          { name: "⭐⭐⭐⭐ 4 sao", value: 4 },
          { name: "⭐⭐⭐⭐⭐ 5 sao", value: 5 }
        )
    )
,
    new SlashCommandBuilder()
  .setName("check")
  .setDescription("Check bảo hành")
  .addStringOption(o =>
    o.setName("order")
      .setDescription("Mã đơn")
      .setRequired(true)
  )
  ,
new SlashCommandBuilder()
  .setName("history")
  .setDescription("Xem lịch sử đơn hàng")
  .addUserOption(o =>
    o.setName("user")
      .setDescription("Người cần xem")
      .setRequired(true)
  )
];

// ===== REGISTER =====
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  await rest.put(
    Routes.applicationGuildCommands("1496147288580685854", "1495637850866319390"),
    { body: commands }
  );
})();

// ===== EVENTS =====
client.on("interactionCreate", async (i) => {
  // ===== BUTTON DONE (THÊM Ở ĐÂY) =====
if (i.isButton() && i.customId.startsWith("done_")) {
  const [_, orderId, product, plan, buyerId] = i.customId.split("_");
  if (i.user.id !== buyerId) {
  return i.reply({
    content: "❌ Đây không phải đơn của bạn",
    ephemeral: true
  });
}
  const price = PRICE_LIST[product]?.[plan] || 0;

  const warrantyDays = PLAN_TIME[plan] || 0;
  const expireAt = Date.now() + warrantyDays * 86400000;
  const expireDate = new Date(expireAt).toLocaleDateString("vi-VN");

  const fs = require("fs");
  if (!fs.existsSync("./orders.json")) {
    fs.writeFileSync("./orders.json", "[]");
  }

let data = [];

try {
  data = JSON.parse(fs.readFileSync("./orders.json"));
} catch {
  data = [];
}

  data.push({
    orderId,
    userId: i.user.id,
    product,
    plan,
    expireAt
  });

  fs.writeFileSync("./orders.json", JSON.stringify(data, null, 2));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`feedback|${orderId}|${product}|${plan}`)
      .setLabel("⭐ Đánh giá ngay")
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setColor("#f1c40f")
    .setTitle("💰 HOÀN THÀNH ĐƠN")
    .setDescription(`
🧾 **Mã đơn**: \`${orderId}\`
💰 **Đơn giá**: \`${price.toLocaleString()}đ\`
🛡 **Bảo hành**: ${PLAN_NAME[plan]}
⏳ **Hết hạn**: ${expireDate}
    `);

  return i.update({
    embeds: [embed],
    components: [row]
  });
}

// ===== BUTTON =====
if (i.isButton() && i.customId.startsWith("feedback")) {
  const parts = i.customId.split("|");
if (parts.length < 3) return;

const orderId = parts[1];
const product = parts[2];
const plan = parts[3];

const productName = PRODUCT_NAME[product] || "Không rõ";
const planName = PLAN_NAME[plan] || "Không rõ";

 const FEEDBACK_LIST = [
  "Shop uy tín, sẽ quay lại ủng hộ 😍",
  "Dịch vụ nhanh, rất hài lòng 🔥",
  "Giá rẻ mà chất lượng quá tốt",
  "Mua lần đầu mà ưng liền",
  "Support nhiệt tình, 10 điểm",
  "Làm nhanh gọn lẹ",
  "Quá ok luôn 👍",
  "Sẽ giới thiệu bạn bè",
  "Rất đáng tiền",
  "Dùng ổn định, không lỗi",
  "Shop làm việc chuyên nghiệp",
  "Hỗ trợ siêu nhanh",
  "Quá xịn luôn 🔥",
  "Lần sau chắc chắn quay lại",
  "Không có gì để chê",
  "Quá ổn áp",
  "Giá hợp lý",
  "Dịch vụ đáng tin cậy",
  "Mua nhiều lần rồi vẫn ok",
  "Uy tín thật sự",
  "Hài lòng 100%",
  "Dùng mượt, không lag",
  "Rất đáng thử",
  "Cực kỳ recommend",
  "Best shop 🔥",
  "Làm việc nhanh chóng",
  "Support tận tâm",
  "Giá tốt, chất lượng cao",
  "Không bị lỗi gì",
  "Rất hài lòng luôn",
  "Mua phát ăn ngay",
  "Chất lượng tuyệt vời",
  "Dùng ngon",
  "Rất đáng mua",
  "Làm việc uy tín",
  "Hỗ trợ cực nhanh",
  "Quá đáng tiền",
  "Không có điểm trừ",
  "Dịch vụ ổn định",
  "Dùng rất ok",
  "Shop làm nhanh thật",
  "Support dễ thương",
  "Làm việc có tâm",
  "Đáng tin cậy",
  "Chất lượng vượt mong đợi",
  "Mượt mà, ổn định",
  "Không gặp lỗi",
  "Hài lòng cực kỳ",
  "Shop làm việc chuyên nghiệp thật",
  "10/10 luôn",
  "Quá tuyệt vời",
  "Dịch vụ nhanh gọn",
  "Support tốt",
  "Rất ưng ý",
  "Giá mềm",
  "Đáng tiền thật",
  "Quá tiện lợi",
  "Dùng ổn",
  "Không có vấn đề gì",
  "Shop đáng tin",
  "Chất lượng ok",
  "Sẽ quay lại",
  "Ổn áp",
  "Quá ngon",
  "Rất tốt",
  "Làm nhanh",
  "Support nhiệt",
  "Dịch vụ ổn",
  "Giá ok",
  "Rất ổn",
  "Quá đẹp",
  "Quá hợp lý",
  "Mượt cực",
  "Dùng thích",
  "Shop ok",
  "Dịch vụ tốt",
  "Rất nhanh",
  "Quá chất",
  "Quá đỉnh",
  "Không lỗi",
  "Dùng ngon lắm",
  "Rất hài lòng",
  "Best luôn",
  "Ổn định",
  "Không lag",
  "Rất tiện",
  "Shop xịn",
  "Đáng mua",
  "Không chê được",
  "Rất ổn định",
  "Quá hợp túi tiền",
  "Dùng rất thích",
  "Quá ngon luôn",
  "Support ok",
  "Shop làm tốt",
  "Không có lỗi gì",
  "Dịch vụ ổn áp",
  "Rất đáng thử 👍"
];

  const randomText = FEEDBACK_LIST[Math.floor(Math.random() * FEEDBACK_LIST.length)];
  const starCount = Math.random() < 0.8 ? 5 : 4;
const stars = "⭐".repeat(starCount);

  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setAuthor({
      name: "💬 Feedback Khách Hàng",
      iconURL: i.user.displayAvatarURL()
    })
    .setDescription(`
👤 **Khách hàng:** <@${i.user.id}>

• **Feedback:** ${randomText}

• **Đánh giá:** ${stars}

📦 **Sản phẩm:**
${productName} - ${planName}
    `)
    .setThumbnail(i.user.displayAvatarURL())
    .setTimestamp();

 
await webhook.send({
  username: i.user.username,
  avatarURL: i.user.displayAvatarURL(),
  embeds: [embed]
});

  await i.update({
  components: [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(i.customId)
        .setLabel("✅ Đã đánh giá")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    )
  ]
});
}

// ===== COMMAND =====
if (!i.isChatInputCommand()) return;
  // ===== ORDER =====
  if (i.commandName === "history") {
  const user = i.options.getUser("user");
  if (i.user.id !== user.id) {
  return i.reply({
    content: "❌ Bạn chỉ được xem lịch sử của mình",
    ephemeral: true
  });
}
  const fs = require("fs");

  if (!fs.existsSync("./orders.json")) {
    return i.reply({
      content: "❌ Chưa có dữ liệu đơn hàng",
      ephemeral: true
    });
  }

  const data = JSON.parse(fs.readFileSync("./orders.json"));

  const userOrders = data.filter(o => o.userId === user.id);

  if (userOrders.length === 0) {
    return i.reply({
      content: "❌ Người này chưa có đơn nào",
      ephemeral: true
    });
  }

  const now = Date.now();

  // 🔥 sort mới nhất lên đầu
  userOrders.sort((a, b) => b.expireAt - a.expireAt);

const list = userOrders.map((o, index) => {
  const expireDate = new Date(o.expireAt).toLocaleDateString("vi-VN");
  const isExpired = now > o.expireAt;

  const status = isExpired 
    ? "🔴 **Hết hạn**" 
    : "🟢 **Còn hạn**";

  return `╭─── 🧾 **Đơn #${index + 1}**
│ 🆔 \`${o.orderId}\`
│ 📦 **${PRODUCT_NAME[o.product]}**
│ ⏳ **${PLAN_NAME[o.plan]}**
│ 📅 Hết hạn: \`${expireDate}\`
│ ${status}
╰──────────────`;
}).join("\n\n");
  const embed = new EmbedBuilder()
    .setColor(userOrders.some(o => now > o.expireAt) ? "#e74c3c" : "#2ecc71")
    .setTitle("📜 LỊCH SỬ ĐƠN HÀNG")
.setDescription(`👤 **Khách hàng:** <@${user.id}>\n\n${list}`)
.setFooter({ text: `Tổng đơn: ${userOrders.length}` })
    .setThumbnail(user.displayAvatarURL())
    .setTimestamp();

  return i.reply({
    embeds: [embed],
    ephemeral: true
  });
}
  if (i.commandName === "order") {
    const user = i.options.getUser("user");
const product = i.options.getString("product");
const plan = i.options.getString("plan");

const orderId = "36-" + Math.floor(10000 + Math.random() * 90000);

const price = PRICE_LIST[product]?.[plan] || 0;
const warrantyDays = PLAN_TIME[plan] || 0;
const expireAt = Date.now() + warrantyDays * 86400000;
const expireDate = new Date(expireAt).toLocaleDateString("vi-VN");

    const embed = new EmbedBuilder()
      .setColor("#00ff99")
      .setTitle("📦 ĐƠN HÀNG MỚI")
      .addFields(
        {
          name: "📦 Sản phẩm",
          value: `\`\`\`\n${PRODUCT_NAME[product]}\n⏱ ${PLAN_NAME[plan]}\n\`\`\``
        },
        { name: "👤 Người mua", value: `<@${user.id}>`, inline: true },
        { name: "🧾 Mã đơn", value: `\`${orderId}\``, inline: true },
        { name: "💰 Đơn giá", value: `\`${price.toLocaleString()}đ\``, inline: true }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "36 Store • Order System" })
      .setTimestamp();

   
    const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId(`done_${orderId}_${product}_${plan}_${user.id}`)
    .setLabel("✅ Hoàn thành đơn")
    .setStyle(ButtonStyle.Success)
);
await i.reply({
  embeds: [embed],
  components: [row]
});
  }
  // ===== CHECK =====
if (i.commandName === "check") {
  const orderId = i.options.getString("order");

  const fs = require("fs");

  if (!fs.existsSync("./orders.json")) {
    return i.reply({ content: "❌ Chưa có dữ liệu đơn hàng", ephemeral: true });
  }

  const data = JSON.parse(fs.readFileSync("./orders.json"));

  const order = data.find(o => o.orderId === orderId);

  if (!order) {
    return i.reply({ content: "❌ Không tìm thấy mã đơn", ephemeral: true });
  }

  const now = Date.now();

  if (now > order.expireAt) {
    return i.reply({ content: "❌ Đơn này đã hết bảo hành", ephemeral: true });
  }

  const remainDays = Math.ceil((order.expireAt - now) / 86400000);

  return i.reply({
    content: `✅ Đơn còn bảo hành ${remainDays} ngày`,
    ephemeral: true
  });
}

});

client.login(process.env.TOKEN);
