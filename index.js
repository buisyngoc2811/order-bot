require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const fs = require("fs");
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
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});
let isReady = false;

client.once("ready", () => {
  console.log("Bot đã online!");
  isReady = true;
});
client.login(process.env.TOKEN);

app.post("/webhook", async (req, res) => {
  if (!isReady) {
  console.log("⚠️ Bot chưa sẵn sàng");
  return res.sendStatus(200);
}
  const data = req.body;

  console.log("💰 SePay gửi:", data);

  const amount = data.amount;
 const content = data.description || data.content;

  if (!content) return res.sendStatus(200);

  const match = content.match(/36-\d+/);
if (!match) return res.sendStatus(200);

const orderId = match[0];
  console.log("👉 orderId:", orderId);
  console.log("👉 description:", content);


  // 🔥 kiểm tra file
  if (!fs.existsSync("./orders.json")) return res.sendStatus(200);

  const orders = JSON.parse(fs.readFileSync("./orders.json"));

  // 🔥 tìm đúng đơn theo user
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return res.sendStatus(200);
if (order.paid) {
  console.log("⚠️ Đơn đã thanh toán rồi");
  return res.sendStatus(200);
}
  const userId = order.userId;
  console.log("👉 userId:", userId);
const expectedPrice = PRICE_LIST[order.product]?.[order.plan] || 0;

  // ❌ nếu chuyển thiếu tiền
if (amount < expectedPrice) {
  const channel = await client.channels.fetch(order.channelId);

if (!channel) {
  console.log("❌ Không tìm thấy channel:", order.channelId);
  return res.sendStatus(200);
}
  await channel.send(
    `⚠️ <@${userId}> chuyển thiếu tiền mất òi :(\n` +
    `💰 Cần: ${expectedPrice.toLocaleString()}đ\n` +
    `💸 Đã chuyển: ${amount.toLocaleString()}đ`
  );

  return res.sendStatus(200);
}
  

  try {
    // 🔥 lấy đúng ticket channel
    const channel = await client.channels.fetch(order.channelId);
    if (!channel) {
  console.log("❌ Không tìm thấy channel:", order.channelId);
  return res.sendStatus(200);
}
    const messages = [
  `💰 Ting ting! <@${userId}> đã thanh toán ${amount.toLocaleString()}đ`,
  `🤑 <@${userId}> vừa nạp ${amount.toLocaleString()}đ xong`,
  `💸 Ví shop vừa kêu ting! (${amount.toLocaleString()}đ)`,
  `🚀 Thanh toán thành công! <@${userId}> đã hoàn tất đơn`
];

const msg = messages[Math.floor(Math.random() * messages.length)];

await channel.send(msg);
   order.paid = true;
order.paidAt = Date.now();

fs.writeFileSync("./orders.json", JSON.stringify(orders, null, 2));
console.log("✅ Đã gửi Discord:", msg);
  } catch (err) {
    console.log("Lỗi gửi ticket:", err);
  }

  res.sendStatus(200);
});
app.get("/", (req, res) => {
  res.send("Bot is alive");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Web server chạy");
});
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
    Routes.applicationGuildCommands("1496147288580685854", "1411071233050808444"),
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
  await i.deferUpdate();
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

  await i.editReply({
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

// 🔥 CHẶN TOÀN BỘ COMMAND
const STAFF_ROLE_ID = "1496252313835274250";

if (!i.member.roles.cache.has(STAFF_ROLE_ID)) {
  return i.reply({
    content: "❌ Bạn không có quyền dùng lệnh!",
    ephemeral: true
  });
}
  // ===== ORDER =====
  if (i.commandName === "history") {
  const user = i.options.getUser("user");
  if (i.user.id !== user.id) {
  return i.reply({
    content: "❌ Bạn chỉ được xem lịch sử của mình",
    ephemeral: true
  });
}
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

  // 👉 lấy dữ liệu từ lệnh
  const user = i.options.getUser("user");
  const product = i.options.getString("product");
  const plan = i.options.getString("plan");

  // 👉 lấy giá từ bảng PRICE_LIST
  const price = PRICE_LIST[product]?.[plan];

  // ❌ nếu sai gói
  if (!price) {
    return i.reply({
      content: "❌ Gói không hợp lệ!",
      ephemeral: true
    });
  }
  // 👉 tạo mã đơn
  const orderId = "36-" + Math.floor(10000 + Math.random() * 90000);
  const channelId = i.channel.id;
  // 👉 tạo nội dung chuyển khoản
  const note = `${orderId}`;
  // 👉 tạo QR
  const qr = `https://img.vietqr.io/image/MB-8999999878-compact.png?amount=${price}&addInfo=${note}`;
  // 👉 tính bảo hành
  const warrantyDays = PLAN_TIME[plan] || 0;
  const expireAt = Date.now() + warrantyDays * 86400000;
  // 🔥 LƯU ORDER
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
  userId: user.id,
  product,
  plan,
  expireAt,
  channelId,
  paid: false 
});

fs.writeFileSync("./orders.json", JSON.stringify(data, null, 2));
  // 👉 tạo embed
  const embed = new EmbedBuilder()
    .setColor("#00ff99")
    .setTitle("📦 ĐƠN HÀNG MỚI")
    .addFields(
  {
    name: "📦 Sản phẩm",
    value: `\`\`\`\n${PRODUCT_NAME[product]} - ${PLAN_NAME[plan]}\n\`\`\``
  },
      { name: "👤 Người mua", value: `<@${user.id}>`, inline: true },
      { name: "🧾 Mã đơn", value: `\`${orderId}\``, inline: true },
      { name: "💰 Đơn giá", value: `\`${price.toLocaleString()}đ\``, inline: true },
      { name: "🏦 Ngân hàng", value: "MB Bank", inline: true },
      { name: "🔢 Số tài khoản", value: "`8999999878`", inline: true },
      { name: "📌 Nội dung CK", value: `\`${note}\`` }
    )
    .setImage(qr) // 🔥 QUAN TRỌNG: QR hiện ở đây
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "36 Store • Order System" })
    .setTimestamp();

  // 👉 nút hoàn thành
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`done_${orderId}_${product}_${plan}_${user.id}`)
      .setLabel("✅ Hoàn thành đơn")
      .setStyle(ButtonStyle.Success)
  );

  // 👉 gửi ra Discord
  await i.reply({
    embeds: [embed],
    components: [row]
  });
}
  // ===== CHECK =====
if (i.commandName === "check") {
  const orderId = i.options.getString("order");
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
