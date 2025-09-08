import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constance";
import { Staff } from "../model/staff.model";
import { Op } from "sequelize";
import {
  aboutBotText,
  aboutEnterpriseText,
  adminMainButtons,
  usersMainButtons,
} from "../bot.constance";

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async throwToStart(ctx: Context) {
    try {
      await ctx.replyWithHTML(`Iltimos, <b>Start</b> tugmasini bosing`, {
        ...Markup.keyboard([["/start"]])
          .oneTime()
          .resize(),
      });
    } catch (error) {
      console.log(`Error on throw to start: `, error);
    }
  }

  async onClickRegister(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await this.staffModel.create({
          user_id: user_id!,
          username: ctx.from?.username!,
          first_name: ctx.from?.first_name!,
          last_name: ctx.from?.last_name!,
          lang: ctx.from?.language_code!,
        });
      }
      if (
        // user?.apply_count != undefined ||
        // user?.apply_count != null ||
        Number(user?.apply_count!) > 3
      ) {
        return await ctx.replyWithHTML(
          `Afsuski siz endi qaytadan ro'yxatdan o'ta olmaysiz`,
          {
            ...Markup.keyboard(
              ctx.from?.id == process.env.ADMIN
                ? adminMainButtons
                : usersMainButtons
            ).resize(),
          }
        );
      }
      await this.staffModel.update(
        { last_state: "name" },
        { where: { user_id } }
      );
      await ctx.replyWithHTML("Ism va Famliyangizni kiriting", {
        ...Markup.removeKeyboard(),
      });
    } catch (error) {
      console.log(`error on onClickRegister`, error);
    }
  }

  async onClickDelete(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      const address_id = contextAction.split("_")[1];

      await this.staffModel.destroy({
        where: { user_id: address_id },
      });
      await ctx.deleteMessage(contextMessage?.message_id);
    } catch (error) {
      console.log(`onClickDelete Error`, error);
    }
  }

  async onClickNote(ctx: Context) {
    try {
      await this.staffModel.update(
        { last_state: "finish" },
        {
          where: {
            last_state: { [Op.like]: "note_%" },
          },
        }
      );
      await this.staffModel.update(
        { last_message_id: null },
        {
          where: {}, // hech qanday shart yo'q → barcha yozuvlarga qo'llanadi
        }
      );

      const contextAction = ctx.callbackQuery!["data"];
      const address_id = contextAction.split("_")[1];

      const usta = await this.staffModel.findOne({
        where: { user_id: address_id },
      });
      if (usta) {
        usta.last_state = "note_" + address_id;
        usta.last_message_id = ctx.callbackQuery?.message?.message_id!;
        console.log(
          "usta.last_message_id onClickNote = ",
          ctx.callbackQuery?.message?.message_id!
        );
        await usta.save();
      }

      let text = `<b>${usta?.name}</b> uchun qayd kiriting.`;
      if (usta?.note) {
        text += `\n\n<b>Eski note:</b>\n<code>${usta.note}</code>`;
      }

      await ctx.replyWithHTML(text, {
        ...Markup.removeKeyboard(),
      });
    } catch (error) {
      console.log(`onClickNote Error`, error);
    }
  }

  async onClickDeleteNote(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const address_id = contextAction.split("_")[1];

      const usta = await this.staffModel.findOne({
        where: { user_id: address_id },
      });
      if (!usta) return `Bunday Id raqamli xodim yo'q!`;

      usta.note = undefined;
      usta.last_message_id = undefined!;
      await usta.save();

      //text (admin uchun)
      const text = await this.staffForm(usta!, "admin");

      await ctx.telegram.editMessageText(
        ctx.chat?.id!,
        ctx.callbackQuery?.message?.message_id!,
        undefined,
        text,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📝 Note",
                  callback_data: `note_${usta!.user_id}`,
                },
                {
                  text: "📝 Note o'chirish",
                  callback_data: `deleteNote_${usta!.user_id}`,
                },
                {
                  text: "❌ O'chirish",
                  callback_data: `del_${usta!.user_id}`,
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.log(`onClickDeleteNote Error`, error);
    }
  }

  async onClickHired(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const address_id = contextAction.split("_")[1];
      const name = ctx.from?.first_name;

      const usta = await this.staffModel.findOne({
        where: { user_id: address_id },
      });
      if (!usta) return;

      // employer maydonini massivga aylantiramiz
      let employers: string[] = usta.employer ? usta.employer.split("\n") : [];

      if (employers.includes(`${name!}`)) {
        // agar bor bo'lsa - chiqarib tashlaymiz
        employers = employers.filter((e) => e !== `${name}`);
      } else {
        // agar yo'q bo'lsa - qo'shamiz
        employers.push(`${name!}`);
      }

      // yangilash
      await this.staffModel.update(
        { employer: employers.join("\n"), last_message_id: undefined },
        { where: { user_id: address_id } }
      );

      // qaytadan yangilangan malumotlarni olish
      const updatedUsta = await this.staffModel.findOne({
        where: { user_id: address_id },
      });

      // umumiy text (hamma adminlar uchun bir xil)
      const text = await this.staffForm(updatedUsta!, "admins");

      // Lekin tugma matni faqat bosgan admin uchun shaxsiy bo‘ladi
      const isHiredByMe = employers.includes(`${name!}`);

      await ctx.telegram.editMessageText(
        ctx.chat?.id!,
        ctx.callbackQuery?.message?.message_id!,
        undefined,
        text,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: isHiredByMe ? "✅ Ishga oldim" : "Ish bermoq",
                  callback_data: `app_${updatedUsta!.user_id}`,
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.log(`onClickHired Error`, error);
    }
  }

  async onApproved(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await this.throwToStart(ctx);
      }
      await this.staffModel.update(
        {
          status: true,
          apply_count: user?.apply_count ? Number(user?.apply_count) + 1 : 1,
        },
        { where: { user_id } }
      );
      const updatedUser = await this.staffModel.findByPk(user_id);
      // ✅ Adminga yuboriladi
      const form = await this.staffForm(updatedUser!, "admin");
      await this.sendToAdmin(updatedUser?.phone_number!, form);
      // ✅ Gruppaga yuboriladi
      const form1 = await this.staffForm(updatedUser!, "admins");
      await this.sendToGroup(updatedUser?.phone_number!, form1);
      await ctx.reply("Ma'lumotlaringiz adminga yuborildi", {
        parse_mode: "HTML",
        ...Markup.keyboard(usersMainButtons).resize(),
      });
    } catch (error) {
      console.log(`error on Approved`, error);
    }
  }

  async onCancel(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.staffModel.findByPk(user_id);
    if (!user) {
      await this.throwToStart(ctx);
    }
    if (
      user?.apply_count != undefined &&
      user?.apply_count != null &&
      user?.apply_count >= 1
    ) {
      await ctx.replyWithHTML(`Ro'yxatdan o'ting`, {
        ...Markup.keyboard([["RO'YXATDAN O'TISH", "🔝 Asosiy menu"]])
          .oneTime()
          .resize(),
      });
    } else {
      await this.staffModel.destroy({ where: { user_id } });
      await ctx.replyWithHTML(`Ro'yxatdan o'ting`, {
        ...Markup.keyboard([["RO'YXATDAN O'TISH"]])
          .oneTime()
          .resize(),
      });
    }
  }

  async onConnectToAdmin(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      // const address_id = contextAction.split("_")[1]; keremas ho

      await ctx.deleteMessage(contextMessage?.message_id);
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await this.throwToStart(ctx);
      }
      await this.staffModel.update({ status: true }, { where: { user_id } });
      console.log("contextMessage->", contextMessage);
      // await this.sendToAdmin(user?.phone_number!, contextMessage || null);
    } catch (error) {
      console.log(`error on Address`, error);
    }
  }

  async sendToAdmin(phone_number: string, form: string) {
    try {
      const staff = await this.staffModel.findOne({ where: { phone_number } });
      if (!staff || !staff.status) {
        return false;
      } else {
        const sentMsg = await this.bot.telegram.sendMessage(
          process.env.ADMIN!,
          form,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📝 Note",
                    callback_data: `note_${staff.user_id}`,
                  },
                  {
                    text: "📝 Note o'chirish",
                    callback_data: `deleteNote_${staff.user_id}`,
                  },
                  {
                    text: "❌ O'chirish",
                    callback_data: `del_${staff.user_id}`,
                  },
                ],
              ],
            },
          }
        );
        // message_id ni saqlaymiz
        await staff.update({ last_message_id: sentMsg.message_id });

        return true;
      }
    } catch (error) {
      console.log(`error on sendToAdmin`, error);
    }
  }

  async sendToGroup(phone_number: string, form: string) {
    try {
      const staff = await this.staffModel.findOne({ where: { phone_number } });
      if (!staff || !staff.status) {
        return false;
      } else {
        await this.bot.telegram.sendMessage(process.env.GROUP_ID!, form, {
          parse_mode: "HTML", // HTML formatni yoqish
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Ish bermoq",
                  callback_data: `app_${staff.user_id}`,
                },
              ],
            ],
          },
        });

        return true;
      }
    } catch (error) {
      console.log(`error on sendToGroup`, error);
      return false;
    }
  }

  async staffForm(usta: Staff, role: string) {
    let about = `
<b>Ismi:</b> ${usta.name}
<b>Yoshi:</b> ${usta.age}
<b>Yashash manzili:</b> ${usta.city}
<b>Tel:</b> ${usta.phone_number}
<b>Sudlanganlik haqida ma'lumot:</b> ${usta.is_convicted}
`;
    if (role == "admin" || role == "admins") {
      about = `<b>Xodim Ma'lumotlari:</b>` + about;
    } else {
      about = `<b>Mening Ma'lumotlarim:</b>` + about;
    }

    if ((role == "admin" || role == "admins") && usta.apply_count == 1) {
      about = `🆕` + about;
    } else if (usta.apply_count == 2) {
      about = `2️⃣` + about;
    } else if (usta.apply_count == 3) {
      about = `3️⃣` + about;
    }
    if (usta.username) {
      about += `<b>Username:</b> @${usta.username}\n`;
    }

    if (usta.createdAt) {
      about += `So'rov sanasi: ${new Date(usta.updatedAt).toLocaleString(
        "uz-UZ",
        {
          weekday: "short", // "Thu"
          year: "numeric", // "2025"
          month: "short", // "May"
          day: "2-digit", // "15"
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      )}.\n`;
    }

    if (usta.note && role == "admin") {
      about += `\n<b>Note:</b> <code>${usta.note}</code>\n`;
    }

    if (usta.employer && (role == "admin" || role == "admins")) {
      about += `\n<b>Employers:</b> ${usta.employer}\n`;
    }

    return about;
  }

  async onMySurvey(ctx: Context) {
    try {
      const staff = await this.staffModel.findOne({
        where: { user_id: ctx.from?.id },
      });
      if (!staff) {
        this.throwToStart(ctx);
      }
      const text = await this.staffForm(staff!, "staff");
      if (staff?.apply_count! < 3) {
        await ctx.replyWithHTML(text);
        await ctx.replyWithHTML(`Qaytadan ro'yxatdan o'tishni xoxlaysizmi ?`, {
          ...Markup.keyboard([["RO'YXATDAN O'TISH", "🔝 Asosiy menu"]])
            .oneTime()
            .resize(),
        });
      } else {
        await ctx.replyWithHTML(text, {
          ...Markup.keyboard(usersMainButtons).resize(),
        });
        // this.toMainMenu(ctx);
      }
    } catch (error) {
      console.log(`Error on onMySurvey: `, error);
    }
  }

  async toMainMenu(ctx: Context) {
    try {
      await ctx.replyWithHTML(`📋 Menu`, {
        ...Markup.keyboard(
          ctx.from?.id == process.env.ADMIN
            ? adminMainButtons
            : usersMainButtons
        ).resize(),
      });
    } catch (error) {
      console.log(`Error on user's toMainMenu: `, error);
    }
  }

  async onEnterprise(ctx: Context) {
    try {
      await ctx.replyWithHTML(aboutEnterpriseText, {
        parse_mode: "HTML",
        ...Markup.keyboard(
          ctx.from?.id == process.env.ADMIN
            ? adminMainButtons
            : usersMainButtons
        ).resize(),
      });
    } catch (error) {
      console.log(`Error on onEnterprise: `, error);
    }
  }
  async aboutBot(ctx: Context) {
    try {
      const userId = String(ctx.from?.id);
      const user = await this.staffModel.findOne({
        where: { user_id: userId },
      });
      if (!user) {
        await this.throwToStart(ctx);
      } else {
        await ctx.replyWithHTML(aboutBotText, {
          ...Markup.keyboard([
            ["✏️ Adminga yozish"],
            ["🔝 Asosiy menu"],
          ]).resize(),
        });
      }
    } catch (error) {
      console.log(`Error on about bot: `, error);
    }
  }

  async onRefferal(ctx: Context) {
    try {
      const userId = String(ctx.from?.id);
      const user = await this.staffModel.findOne({
        where: { user_id: userId },
      });
      if (!user) {
        await this.throwToStart(ctx);
      } else {
        await ctx.reply(
          `🎯 Do'stlaringizni taklif qiling`,
          Markup.inlineKeyboard([
            Markup.button.switchToChat("📩 Do'stlarni taklif qilish", ``),
          ])
        );
      }
    } catch (error) {
      console.log(`Error on refferal: `, error);
    }
  }
  async writeToAdmin(ctx: Context) {
    try {
      const user_id = String(ctx.from?.id);
      const user = await this.staffModel.findOne({ where: { user_id } });
      if (!user) {
        await this.throwToStart(ctx);
      } else {
        await this.staffModel.update(
          { last_state: "writeToAdmin" },
          { where: { user_id } }
        );
        await ctx.replyWithHTML(`Savolingizni yozing ⬇️`, {
          ...Markup.keyboard(["🔝 Asosiy menu"]).resize(),
        });
      }
    } catch (error) {
      console.log(`Error on user's toMainMenu: `, error);
    }
  }
  async responseToUser(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      const userId = contextAction.split("_")[2];
      const adminUserId = contextAction.split("_")[1];
      await this.staffModel.update(
        { last_state: `responsetouser_${userId}` },
        { where: { user_id: adminUserId } }
      );
      // ctx.deleteMessage(contextMessage!.message_id);
      ctx.replyWithHTML("Foydalanuvchiga javobni yozing.", {
        ...Markup.keyboard([["Asosiy Menu"]]).resize(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async onClickCity(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const city = contextAction.split("_")[1];
      const address_id = contextAction.split("_")[2];

      const usta = await this.staffModel.findOne({
        where: { user_id: address_id },
      });
      if (!usta) {
        await this.throwToStart(ctx);
      }
      // yangilash
      await this.staffModel.update(
        { city, last_state: "phone_number" },
        { where: { user_id: address_id } }
      );
      await ctx.deleteMessage();
      await ctx.reply("📱 Telefon raqamingizni kiriting :", {
        ...Markup.keyboard([
          [Markup.button.contactRequest("Telefon raqam yuborish")],
        ])
          .oneTime()
          .resize(),
      });
    } catch (error) {
      console.log(`onClickHired Error`, error);
    }
  }

  async isConvicted(ctx: Context) {
    try {
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
      const contextAction = ctx.callbackQuery.data;
      const convicted = contextAction.split("_")[1];
      const address_id = Number(contextAction.split("_")[2]);

      const usta = await this.staffModel.findOne({
        where: { user_id: address_id },
      });
      if (!usta) {
        return this.throwToStart(ctx);
      }

      const ustaCheck = await this.staffModel.findOne({
        where: { user_id: address_id, last_state: "is_convicted" },
      });
      if (!ustaCheck) {
        return await ctx.reply(
          "Hozir Sudlanganlik haqida ma'lumot tanlay olmaysiz"
        );
      }

      // yangilash
      usta.is_convicted = convicted;
      usta.last_state = "finish";
      await usta.save();
      const text = await this.staffForm(usta, "usta");
      await ctx.replyWithHTML(text);

      // const contextMessage = ctx.callbackQuery!["message"];
      // const address_id = contextAction.split("_")[1];

      // await this.staffModel.destroy({
      //   where: { user_id: address_id },
      // });
      await ctx.deleteMessage(ctx.message?.message_id);
      await ctx.reply("Ma'lumotlarni tasdiqlaysizmi?", {
        ...Markup.keyboard([["✅ TASDIQLASH", "❌ BEKOR QILISH"]])
          .resize()
          .oneTime(),
      });
    } catch (error) {
      console.log(`IsConvicted Error`, error);
    }
  }

  //Admin uchun ochirma
  async onNewWorkers(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await ctx.reply(`Avval siz ro'yxatdan o'ting`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
      } else {
        const workers = await this.staffModel.findAll({
          where: { last_state: "finish" },
        });
        console.log(workers);
        if (workers.length == 0) {
          await ctx.replyWithHTML("Birorta Xodim topilmadi", {
            ...Markup.keyboard(adminMainButtons).oneTime().resize(),
          });
        } else {
          workers.forEach(async (worker) => {
            const text = await this.staffForm(worker, "admin");
            await ctx.replyWithHTML(text, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "📝 Note",
                      callback_data: `note_${worker.user_id}`,
                    },
                    {
                      text: "📝 Note o'chirish",
                      callback_data: `deleteNote_${worker.user_id}`,
                    },
                    {
                      text: "❌ O'chirish",
                      callback_data: `del_${worker.user_id}`,
                    },
                  ],
                ],
              },
            });
          });
        }
      }
    } catch (error) {
      console.log(`error on onNewWorkers`, error);
    }
  }
}
