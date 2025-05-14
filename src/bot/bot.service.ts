import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { Op } from "sequelize";
import { BOT_NAME } from "../app.constance";
import { Staff } from "./model/staff.model";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async start(ctx: Context) {
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
        await ctx.replyWithHTML(`Ro'yxatdan o'ting`, {
          ...Markup.keyboard([["RO'YXATDAN O'TISH"]])
            .oneTime()
            .resize(),
        });
      } else {
        await ctx.replyWithHTML(
          "Bu bot orqali Maishiy-xizmatlar dasturida ustalar va mijozlar faollashtiriladi",
          { ...Markup.removeKeyboard() }
        );
      }
    } catch (error) {
      console.log(`error on start`, error);
    }
  }

  async onLocation(ctx: Context) {
    try {
      if ("location" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.staffModel.findByPk(user_id);
        if (!user) {
          await ctx.reply(`Siz Avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]]).resize(),
          });
        } else {
          const address = await this.staffModel.findOne({
            where: {
              user_id,
              last_state: { [Op.ne]: "finish" },
            },
            order: [["user_id", "DESC"]],
          });
          if (address && address.last_state == "location") {
            address.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`;
            address.last_state = "start";
            await address.save();
            await ctx.reply("Ustaxonada ish boshlanish vaqtini kiriting:", {
              parse_mode: "HTML",
              ...Markup.removeKeyboard(),
            });
          }
        }
      }
    } catch (error) {
      console.log(`OnLocation Error`, error);
    }
  }

  async onContact(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await ctx.replyWithHTML(`Iltimos, <b>Start</b> tugmasini bosing`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
      } else if (user.phone_number) {
        await this.bot.telegram.sendChatAction(user_id!, "typing");
        await ctx.replyWithHTML("Siz avval ro'yxatdan o'tgansiz", {
          ...Markup.removeKeyboard(),
        });
      } else if (
        "contact" in ctx.message! &&
        ctx.message.contact.user_id != user_id
      ) {
        await ctx.replyWithHTML(
          `Iltimos, <b>Iltimos o'zingizni raqamingizni yuboring</b>`,
          {
            ...Markup.keyboard([
              [Markup.button.contactRequest("Telefon raqamini yuborish")],
            ])
              .oneTime()
              .resize(),
          }
        );
      } else if ("contact" in ctx.message!) {
        let phone = ctx.message.contact.phone_number;
        if (phone[0] != "+") {
          phone = "+" + phone;
        }
        user.phone_number = phone;
        user.last_state = "ustaxonaNomi";
        await user.save();
        await ctx.replyWithHTML(`Ustaxona nomini kiriting:`, {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log(`error on Contact`, error);
    }
  }

  async onStop(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await ctx.replyWithHTML(`Iltimos, <b>Start</b> tugmasini bosing`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
      } else if (user.status) {
        user.status = false;
        user.phone_number = "";
        await user.save();
        await ctx.replyWithHTML(
          `Siz vaqtincha bo'tdan chiqdingiz. Qayta faollashtirish \
           uchun <b>/start</b> tugmasini bosing`,
          {
            ...Markup.keyboard([["/start"]])
              .oneTime()
              .resize(),
          }
        );
      }
    } catch (error) {
      console.log(`error on onStop`, error);
    }
  }

  async onStaff(ctx: Context) {
    try {
      console.log("onStaff ishlavotti");
      if ("avto" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.staffModel.findByPk(user_id);
        if (!user) {
          await ctx.reply(`Siz Avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]]).resize(),
          });
        } else {
          const staff = await this.staffModel.findOne({
            where: {
              user_id,
              last_state: { [Op.ne]: "finish" },
            },
            order: [["id", "DESC"]],
          });
          if (staff && staff.last_state == "year") {
            staff.last_state = "finish";
            await staff.save();
            await ctx.reply(
              "Usta ma'lumotlari Tasdiqlash uchun adminga yuborildi.",
              {
                parse_mode: "HTML",
              }
            );
          }
        }
      }
    } catch (error) {
      console.log(`OnLocation Error`, error);
    }
  }

  async onText(ctx: Context) {
    if ("text" in ctx.message!) {
      try {
        const user_id = ctx.from?.id;
        const user = await this.staffModel.findByPk(user_id);
        if (!user) {
          await ctx.replyWithHTML(`Iltimos, <b>Start</b> tugmasini bosing`, {
            ...Markup.keyboard([["/start"]])
              .oneTime()
              .resize(),
          });
        } else {
          // ---------------------------------Staff-------------------------------
          const usta = await this.staffModel.findOne({
            where: {
              user_id,
              last_state: { [Op.ne]: "finish" },
            },
            order: [["user_id", "DESC"]],
          });
          if (usta) {
            const userInput = ctx.message.text;
            switch (usta.last_state) {
              case "name":
                usta.name = userInput;
                usta.last_state = "phone_number";
                await usta.save();
                await ctx.reply("Telefon raqamingizni kiriting:", {
                  ...Markup.keyboard([
                    [Markup.button.contactRequest("Telefon raqam yuborish")],
                  ])
                    .oneTime()
                    .resize(),
                });
                break;
              case "ustaxonaNomi":
                usta.ustaxonaNomi = userInput;
                usta.last_state = "address";
                await usta.save();
                await ctx.reply("Ustaxona addressini kiriting:", {
                  parse_mode: "HTML",
                  ...Markup.removeKeyboard(),
                });
                break;
              case "address":
                usta.address = userInput;
                usta.last_state = "muljal";
                await usta.save();
                await ctx.reply("Ustaxona mo'ljalini kiriting:", {
                  parse_mode: "HTML",
                  ...Markup.removeKeyboard(),
                });
                break;
              case "muljal":
                usta.muljal = userInput;
                usta.last_state = "location";
                await usta.save();
                await ctx.reply("Ustaxona locatsiyasini kiriting:", {
                  parse_mode: "HTML",
                  ...Markup.keyboard([
                    [Markup.button.locationRequest("Lokatsiya yuborish")],
                  ]).resize(),
                });
                break;

              case "start":
                usta.start = userInput;
                usta.last_state = "end";
                await usta.save();
                await ctx.reply("Ustaxonada ish tugash vaqtini kiriting:", {
                  parse_mode: "HTML",
                  ...Markup.removeKeyboard(),
                });
                break;

              case "end":
                usta.end = userInput;
                usta.last_state = "avgClientTime";
                await usta.save();
                await ctx.reply(
                  "Ustaxonad mir mijoz uchun o'rtacha sarflanadigan vaqtini kiriting:",
                  {
                    parse_mode: "HTML",
                    ...Markup.removeKeyboard(),
                  }
                );
                break;

              case "avgClientTime":
                usta.avgClientTime = userInput;
                usta.last_state = "finish";
                await usta.save();
                await ctx.replyWithHTML(
                  `
                  \t\t<b>Xodim ma'lumotlari:</b>
<b>Ismi:</b>${usta.name}
<b>Kasbi:</b> ${usta.occupation}
<b>Tel:</b> ${usta.phone_number}
<b>Username:</b> ${usta.username}
<b>Ustaxona nomi:</b> ${usta.ustaxonaNomi}
<b>Address:</b> ${usta.address}
<b>Mo'ljal:</b> ${usta.muljal}
<b>Ish boshlanish vaqti:</b> ${usta.start}
<b>Ish tugash vaqti:</b> ${usta.end}
<b>Bir mijoz uchun o'rtacha sarflanadigan vaqt:</b> ${usta.avgClientTime}\n
<b>So'rov sanasi:</b> ${new Date(usta.createdAt).toLocaleString("uz-UZ", {
                    weekday: "short", // "Thu"
                    year: "numeric", // "2025"
                    month: "short", // "May"
                    day: "2-digit", // "15"
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })}.
                  `
                );
                await ctx.reply("Ma'lumotlarni tasdiqlaysizmi?", {
                  parse_mode: "HTML",
                  ...Markup.keyboard([["✅ TASDIQLASH", "❌ BEKOR QILISH"]])
                    .resize()
                    .oneTime(),
                });
            }
          }
        }
      } catch (error) {
        console.log(`Error on Text`, error);
      }
    }
  }
  // ---------------------------------Staff-------------------------------

  // ---------------------------------Admin-------------------------------
  async admin_menu(ctx: Context, menu_text = `<b>Admin menusi</b>`) {
    try {
      await ctx.reply(menu_text, {
        parse_mode: "HTML",
        ...Markup.keyboard([["Mening xodimlarim", "Mening mijozlarim"]])
          .oneTime()
          .resize(),
      });
    } catch (error) {
      console.log("Admin man_u sida xatolik", error);
    }
  }
}
