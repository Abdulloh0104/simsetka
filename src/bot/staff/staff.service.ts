import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BOT_NAME } from "../../app.constance";
import { Staff } from "../model/staff.model";

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

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
        await ctx.replyWithHTML(
          `Iltimos, <b>Ro'yxat</b>dan kim bo'lib o'tishingizni tanlang`,
          {
            ...Markup.keyboard([["Mijoz", "Usta"]])
              .oneTime()
              .resize(),
          }
        );
      }

      await ctx.replyWithHTML(
        `Iltimos, <b>Ro'yxat</b>dan kim bo'lib o'tishingizni tanlang`,
        {
          ...Markup.keyboard([["Mijoz", "Usta"]])
            .oneTime()
            .resize(),
        }
      );
    } catch (error) {
      console.log(`error on Address`, error);
    }
  }

  async onNewStaff(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await ctx.replyWithHTML(`Iltimos, <b>Start</b> tugmasini bosing`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
      }

      // user!.last_state = "name"
      // user?.save()

      const jobs = ["SARTAROSH", "GUZALLIK", "ZARGAR", "SOATSOZ", "ETIKDOZ"];
      await ctx.replyWithHTML("Quyidagi bo'limlardan birini tanlang", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "SARTAROSHXONA",
                callback_data: `occ_${user_id}_${jobs[0]}`,
              },
            ],
            [
              {
                text: "GO’ZALLIK SALONI",
                callback_data: `occ_${user_id}_${jobs[1]}`,
              },
            ],
            [
              {
                text: "ZARGARLIK USTAXONASI",
                callback_data: `occ_${user_id}_${jobs[2]}`,
              },
            ],
            [
              {
                text: "SOATSOZ",
                callback_data: `occ_${user_id}_${jobs[3]}`,
              },
            ],
            [
              {
                text: "POYABZAL USTAXONASI",
                callback_data: `occ_${user_id}_${jobs[4]}`,
              },
            ],
          ],
        },
      });
    } catch (error) {
      console.log(`error on Address`, error);
    }
  }

  async onClickLocation(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      const address_id = contextAction.split("_")[1];
      const address = await this.staffModel.findByPk(address_id);
      await ctx.deleteMessage(contextMessage?.message_id);
      await ctx.replyWithLocation(
        Number(address?.location.split(",")[0]),
        Number(address?.location.split(",")[1])
      );
    } catch (error) {
      console.log(`onClickLocation Error`, error);
    }
  }

  async onClickOccupation(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      const staff_id = contextAction.split("_")[1];
      const staff_occupation = contextAction.split("_")[2];
      await this.staffModel.update(
        { occupation: staff_occupation, last_state: "name" },
        { where: { user_id: staff_id } }
      );
      await ctx.deleteMessage(contextMessage?.message_id);
      await ctx.replyWithHTML("Ismingizni kiriting", {
        ...Markup.removeKeyboard(),
      });
    } catch (error) {
      console.log(`onClickLocation Error`, error);
    }
  }

  async onClickApproved(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const contextMessage = ctx.callbackQuery!["message"];
      const address_id = contextAction.split("_")[1];

      await this.staffModel.update(
        { isApproved: true },
        {
          where: { user_id: address_id },
        }
      );

      await ctx.deleteMessage(contextMessage?.message_id);
      // await ctx.editMessageText("Manzil o'chirildi");
    } catch (error) {
      console.log(`onClickDelete Error`, error);
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

  async onApproved(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await ctx.replyWithHTML(`Iltimos, <b>Start</b> tugmasini bosing`, {
          ...Markup.keyboard([["/start"]])
            .oneTime()
            .resize(),
        });
      }
      await this.staffModel.update({ status: true }, { where: { user_id } });
      const form = await this.staffForm(user!);
      await this.sendToAdmin(user?.phone_number!, form);
      await ctx.replyWithHTML("Tasdiqlash uchun adminga yuborildi", {
        ...Markup.keyboard([
          ["TEKSHIRISH", "❌ BEKOR QILISH"],
          ["ADMIN BILAN BOG’LANISH"],
        ])
          .resize()
          .oneTime(),
      });
    } catch (error) {
      console.log(`error on Address`, error);
    }
  }

  async onCancel(ctx: Context) {
    const user_id = ctx.from?.id;
    await this.staffModel.destroy({ where: { user_id } });
    await ctx.replyWithHTML(`Ro'yxatdan o'ting`, {
      ...Markup.keyboard([["RO'YXATDAN O'TISH"]])
        .oneTime()
        .resize(),
    });
  }

  async onCheck(ctx: Context) {
    const user_id = ctx.from?.id;
    const user = await this.staffModel.findByPk(user_id);
    if (user && !user?.isApproved) {
      await ctx.replyWithHTML("Adminga yuborilgan, tekshirilmoqda...", {
        ...Markup.keyboard([
          ["TEKSHIRISH", "❌ BEKOR QILISH"],
          ["ADMIN BILAN BOG’LANISH"],
        ])
          .resize()
          .oneTime(),
      });
    } else if (!user) {
      await ctx.replyWithHTML(
        `Afsuski So'rovingin Admin tomonidan tasdiqlanmadi. Yana urunish uchun, Ro'yxatdan o'ting`,
        {
          ...Markup.keyboard([["RO'YXATDAN O'TISH"]])
            .oneTime()
            .resize(),
        }
      );
    } else {
      const inlineKeyboard = [
        [
          {
            text: "MIJOZLAR",
            callback_data: "staff_clients",
          },
          {
            text: "VAQT",
            callback_data: "staff_time",
          },
          {
            text: "REYTING",
            callback_data: "staff_star",
          },
        ],
        [
          {
            text: "MA’LUMOTLARNI O’ZGARTIRISH",
            callback_data: "staff_changeinfo",
          },
        ],
      ];
      await ctx.replyWithHTML(
        "Muvaffaqqiyatli so'rovnomadan o'tib olganingiz bilan tabriklayman",
        {
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        }
      );
    }
  }

  async sendToAdmin(phone_number: string, form: string) {
    try {
      const staff = await this.staffModel.findOne({ where: { phone_number } });
      if (!staff || !staff.status) {
        return false;
      } else {
        await this.bot.telegram.sendMessage(process.env.ADMIN!, form, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Tasdiqlash",
                  callback_data: `app_${staff.user_id}`,
                },
                {
                  text: "❌ Bekor qilish",
                  callback_data: `del_${staff.user_id}`,
                },
              ],
            ],
          },
        });
        return true;
      }
    } catch (error) {
      console.log(`error on SendOTP`, error);
    }
  }

  async staffForm(usta: Staff) {
    const about = `
      \t\tXodim Ma'lumotlari:
Ismi:${usta.name}
Kasbi: ${usta.occupation}
Tel: ${usta.phone_number}
Username: @${usta.username}
Ustaxona nomi: ${usta.ustaxonaNomi}
Address: ${usta.address}
Mo'ljal: ${usta.muljal}
Ish boshlanish vaqti: ${usta.start}
Ish tugash vaqti: ${usta.end}
Bir mijoz uchun o'rtacha sarflanadigan vaqt: ${usta.avgClientTime}\n
So'rov sanasi: ${new Date(usta.createdAt).toLocaleString("uz-UZ", {
      weekday: "short", // "Thu"
      year: "numeric", // "2025"
      month: "short", // "May"
      day: "2-digit", // "15"
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })}.
          `;

    return about;
  }

  //Udmin uchun ochirma
  // async onMyAddresses(ctx: Context) {
  //   try {
  //     const user_id = ctx.from?.id;
  //     const user = await this.staffModel.findByPk(user_id);
  //     if (!user) {
  //       await ctx.reply(`Avval siz ro'yxatdan o'ting`, {
  //         ...Markup.keyboard([["/start"]])
  //           .oneTime()
  //           .resize(),
  //       });
  //     } else {
  //       const addresses = await this.staffModel.findAll({
  //         where: { user_id, last_state: "finish" },
  //       });
  //       if (addresses.length == 0) {
  //         await ctx.replyWithHTML("Birorta manzil topilmadi", {
  //           ...Markup.keyboard([
  //             ["Mening manzillarim", "Yangi manzil qo'shish"],
  //           ]),
  //         });
  //       } else {
  //         addresses.forEach(async (address) => {
  //           await ctx.replyWithHTML(
  //             `<b>Manzil nomi:</b> ${address.name}\n<b>Manzil:</b> ${address.address}`,
  //             {
  //               reply_markup: {
  //                 inline_keyboard: [
  //                   [
  //                     {
  //                       text: "Locatsiyani ko'rish",
  //                       callback_data: `loc_${address.id}`,
  //                     },
  //                     {
  //                       text: "Manzilni o'chirish",
  //                       callback_data: `del_${address.id}`,
  //                     },
  //                   ],
  //                 ],
  //               },
  //             }
  //           );
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.log(`error on MyAddress`, error);
  //   }
  // }
}
