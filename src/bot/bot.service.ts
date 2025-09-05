import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { InjectBot } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { Op } from "sequelize";
import { BOT_NAME } from "../app.constance";
import { Staff } from "./model/staff.model";
import { StaffService } from "./staff/staff.service";
import { adminMainButtons, usersMainButtons } from "./bot.constance";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Staff) private readonly staffModel: typeof Staff,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly staffService: StaffService // chaqirish mumkin
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
      } else if (user.last_state !== "finish") {
        await ctx.replyWithHTML(
          `Hozir \start buyrug'i amalga oshirilishi mumkin emas`,
          {
            parse_mode: "HTML",
          }
        );
      } else {
        await ctx.replyWithHTML(
          "Bu bot orqali Sim Setka dasturida ustalar ma'lumot qoldiradilar",
          {
            parse_mode: "HTML",
            ...Markup.keyboard(usersMainButtons).resize(),
          }
        );
      }
    } catch (error) {
      console.log(`error on start`, error);
    }
  }

  // async onLocation(ctx: Context) {
  //   try {
  //     if ("location" in ctx.message!) {
  //       const user_id = ctx.from?.id;
  //       const user = await this.staffModel.findByPk(user_id);
  //       if (!user) {
  //         await ctx.reply(`Siz Avval ro'yxatdan o'ting`, {
  //           parse_mode: "HTML",
  //           ...Markup.keyboard([["/start"]]).resize(),
  //         });
  //       } else {
  //         const address = await this.staffModel.findOne({
  //           where: {
  //             user_id,
  //             last_state: { [Op.ne]: "finish" },
  //           },
  //           order: [["user_id", "DESC"]],
  //         });
  //         if (address && address.last_state == "location") {
  //           address.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`;
  //           address.last_state = "start";
  //           await address.save();
  //           await ctx.reply("Ustaxonada ish boshlanish vaqtini kiriting:", {
  //             parse_mode: "HTML",
  //             ...Markup.removeKeyboard(),
  //           });
  //         }
  //       }
  //     }x
  //   } catch (error) {
  //     console.log(`OnLocation Error`, error);
  //   }
  // }

  async onContact(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.staffModel.findByPk(user_id);
      if (!user) {
        await this.staffService.throwToStart(ctx);
      } else if (user.phone_number && user.last_state == "finish") {
        await this.bot.telegram.sendChatAction(user_id!, "typing");
        await ctx.replyWithHTML(
          "Telefon raqamingizni o'zgartirish uchun qaytadan ro'yxatdan o'ting",
          {
            ...Markup.keyboard(usersMainButtons).resize(),
          }
        );
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
        user.last_state = "is_convicted";
        await user.save();
        await ctx.replyWithHTML("⚖️ Avval sudlanganmisiz?", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Ha", callback_data: `convicted_Ha_${user.user_id}` },
                {
                  text: "Yo'q",
                  callback_data: `convicted_Yo'q_${user.user_id}`,
                },
              ],
            ],
          },
        }); // Telefon raqam qo'lda kiritiladigan bo'ldi
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
        console.log("keldim stop");
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
  // ================================
  // MANIMCH KEREMAS O"CHIRVORAMAN
  // ================================
  // async onStaff(ctx: Context) {
  //   try {
  //     console.log("onStaff ishlavotti");
  //     if ("avto" in ctx.message!) {
  //       const user_id = ctx.from?.id;
  //       const user = await this.staffModel.findByPk(user_id);
  //       if (!user) {
  //         await ctx.reply(`Siz Avval ro'yxatdan o'ting`, {
  //           parse_mode: "HTML",
  //           ...Markup.keyboard([["/start"]]).resize(),
  //         });
  //       } else {
  //         const staff = await this.staffModel.findOne({
  //           where: {
  //             user_id,
  //             last_state: { [Op.ne]: "finish" },
  //           },
  //           order: [["id", "DESC"]],
  //         });
  //         if (staff && staff.last_state == "year") {
  //           staff.last_state = "finish";
  //           await staff.save();
  //           await ctx.reply(
  //             "Usta ma'lumotlari Tasdiqlash uchun adminga yuborildi.",
  //             {
  //               parse_mode: "HTML",
  //             }
  //           );
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.log(`OnLocation Error`, error);
  //   }
  // }

  async onText(ctx: Context) {
    if ("text" in ctx.message! && ctx.message.chat.type == "private") {
      try {
        const user_id = ctx.from?.id;
        const user = await this.staffModel.findByPk(user_id);
        if (!user) {
          await this.staffService.throwToStart(ctx);
        } else {
          // 1) Admin qayd rejim

          // 1) last_state = "noite_" bo'lgan ustani topamiz
          const newUsta = await this.staffModel.findOne({
            where: {
              last_state: {
                [Op.like]: "note_%", // Sequelize operator kerak bo‘ladi
              },
            },
          });

          if (newUsta) {
            const targetUserId = newUsta.last_state.split("_")[1];
            let target = await this.staffModel.findOne({
              where: { user_id: targetUserId },
            });
            if (!target) {
              await ctx.reply("❌ Qaytadan Note tugmasini bosib ko'ring");
              return;
            }
            // 2) Qaydni saqlaymiz
            await this.staffModel.update(
              {
                last_state: "finish",
                note: ctx.message.text,
              },
              { where: { user_id: targetUserId } }
            );

            // 3) Admin uchun yangilash
            target = await this.staffModel.findOne({
              where: { user_id: targetUserId },
            });
            const form = await this.staffService.staffForm(target!, "admin");
            if (target!.last_message_id) {
              await ctx.telegram.editMessageText(
                process.env.ADMIN!,
                target?.last_message_id,
                undefined,
                form,
                {
                  parse_mode: "HTML",
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "📝 Note",
                          callback_data: `note_${target!.user_id}`,
                        },
                        {
                          text: "📝 Note o'chirish",
                          callback_data: `deleteNote_${target!.user_id}`,
                        },
                        {
                          text: "❌ O'chirish",
                          callback_data: `del_${target!.user_id}`,
                        },
                      ],
                    ],
                  },
                }
              );
            }
            // 4) last_message_idni o'chiramiz
            await this.staffModel.update(
              {
                last_message_id: null,
              },
              { where: { user_id: targetUserId } }
            );
            await ctx.replyWithHTML(
              `✅ Qayd saqlandi:\n\n<b>${target!.note}</b>`,
              {
                ...Markup.keyboard(adminMainButtons).resize(),
              }
            );
          }

          // // -----------------------Admin Ustaga javob yozishi--------------------

          if (user.last_state.startsWith("responsetouser_")) {
            const ustaId = user.last_state.split("_")[1];
            await this.bot.telegram.sendMessage(
              Number(ustaId),
              `<b>Admin savolingizga javob berdi.</b>\n\n` + ctx.message.text,
              {
                parse_mode: "HTML",
              }
            );
            user.last_state = "";
            await user.save();
            await ctx.replyWithHTML("Xabar foydalanuvchiga yuborildi.", {
              ...Markup.keyboard(adminMainButtons).resize(),
            });
          }
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
                // 2 tadan kam yoki 30 dan uzun bo‘lsa
                if (userInput.length < 2 || userInput.length > 30) {
                  await ctx.reply(
                    "❌ Ism familiya uzunligi 2 ta harfdan kam yoki 30 ta harfdan ko‘p bo‘lmasligi kerak. Qaytadan kiriting:"
                  );
                  return;
                }

                // faqat ruxsat etilgan belgilarni tekshirish
                if (!/^[A-Za-zА-Яа-яЁёЎҒҚҲЬЪʼ' ]+$/.test(userInput)) {
                  await ctx.reply(
                    "❌ Ism familiya faqat harflardan iborat bo‘lishi kerak. Raqam va maxsus belgilar kiritmang:"
                  );
                  return;
                }

                usta.name = userInput;
                usta.last_state = "age";
                await usta.save();

                await ctx.reply("Yoshingizni kiriting:", {
                  parse_mode: "HTML",
                  ...Markup.removeKeyboard(),
                });
                break;

              case "age":
                if (!/^\d+$/.test(userInput)) {
                  await ctx.reply("❌ Yoshingizni faqat raqam bilan kiriting:");
                  return;
                }

                const age = Number(userInput);
                if (age < 18 || age > 70) {
                  await ctx.reply(
                    "❌ Yosh 18–70 oralig‘ida bo‘lishi kerak. Qaytadan kiriting:"
                  );
                  return;
                }

                usta.age = userInput;
                usta.last_state = "city";
                await usta.save();
                await ctx.reply("🌆 Qaysi hududdansiz?", {
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "Toshkent shahri",
                          callback_data: `city_Toshkent shahri_${usta.user_id}`,
                        },
                        {
                          text: "Xorazm",
                          callback_data: `city_Xorazm_${usta.user_id}`,
                        },
                      ],
                      [
                        {
                          text: "Andijon",
                          callback_data: `city_Andijon_${usta.user_id}`,
                        },
                        {
                          text: "Buxoro",
                          callback_data: `city_Buxoro_${usta.user_id}`,
                        },
                      ],
                      [
                        {
                          text: "Farg'ona",
                          callback_data: `city_Fargona_${usta.user_id}`,
                        },
                        {
                          text: "Jizzax",
                          callback_data: `city_Jizzax_${usta.user_id}`,
                        },
                      ],
                      [
                        {
                          text: "Namangan",
                          callback_data: `city_Namangan_${usta.user_id}`,
                        },
                        {
                          text: "Navoiy",
                          callback_data: `city_Navoiy_${usta.user_id}`,
                        },
                      ],
                      [
                        {
                          text: "Qashqadaryo",
                          callback_data: `city_Qashqadaryo_${usta.user_id}`,
                        },
                        {
                          text: "Samarqand",
                          callback_data: `city_Samarqand_${usta.user_id}`,
                        },
                      ],
                      [
                        {
                          text: "Sirdaryo",
                          callback_data: `city_Sirdaryo_${usta.user_id}`,
                        },
                        {
                          text: "Surxondaryo",
                          callback_data: `city_Surxondaryo_${usta.user_id}`,
                        },
                      ],
                      [
                        {
                          text: "Qoraqalpog'iston Respublikasi",
                          callback_data: `city_Qoraqalpogiston Respublikasi_${usta.user_id}`,
                        },
                      ],
                    ],
                  },
                });
                break;

              // 2️⃣ Shahar tanlash (faqat tugmadan)
              case "city":
                console.log(ctx.callbackQuery);
                if (
                  !ctx.callbackQuery ||
                  !("data" in ctx.callbackQuery) ||
                  !ctx.callbackQuery.data.startsWith("city_")
                ) {
                  return ctx.reply("❌ Iltimos, tugmadan foydalaning.");
                }

                const city = ctx.callbackQuery.data.replace("city_", "");
                usta.city = city;

                usta.last_state = "phone_number";
                await usta.save();
                await ctx.deleteMessage();
                await ctx.reply(
                  "📱 Telefon raqamingizni kiriting (+998 bilan yoki 9 xonali):",
                  {
                    parse_mode: "HTML",
                    ...Markup.removeKeyboard(),
                  }
                );

                break;

              case "phone_number":
                let phone = userInput.replace(/\s/g, ""); // bo‘sh joylarni olib tashlaymiz
                if (/^\d{9}$/.test(phone)) {
                  phone = `+998${phone}`; // agar faqat 9 ta raqam bo‘lsa → +998 qo‘shamiz
                }
                if (!/^\+998\d{9}$/.test(phone)) {
                  await ctx.reply(
                    //sho'tga keldim
                    "❌ Telefon raqam formati noto‘g‘ri. Masalan: +998901234567"
                  );
                  return;
                }
                usta.phone_number = phone;
                usta.last_state = "is_convicted";
                await usta.save();
                await ctx.reply("⚖️ Avval sudlanganmisiz?", {
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "Ha",
                          callback_data: `convicted_Ha_${usta.user_id}`,
                        },
                        {
                          text: "Yo'q",
                          callback_data: `convicted_Yo'q_${usta.user_id}`,
                        },
                      ],
                    ],
                  },
                });
                break;

              case "is_convicted":
                if (
                  !ctx.callbackQuery
                  // || !ctx.callbackQuery.data.startsWith("is_convicted_")
                ) {
                  await ctx.reply(
                    "❌ Iltimos, tugmalardan birini tanlang: 'Ha' yoki 'Yo‘q'"
                  );
                  return;
                }
                usta.is_convicted = userInput;
                usta.last_state = "finish";
                await usta.save();
                const text = await this.staffService.staffForm(usta, "usta");
                await ctx.replyWithHTML(text);
                await ctx.reply("Ma'lumotlarni tasdiqlaysizmi?", {
                  parse_mode: "HTML",
                  ...Markup.keyboard([["✅ TASDIQLASH", "❌ BEKOR QILISH"]])
                    .resize()
                    .oneTime(),
                });
                break;
              case "writeToAdmin":
                const userId = String(ctx.from?.id);
                const user = await this.staffModel.findOne({
                  where: { user_id: userId },
                });
                if (!user) {
                  await this.staffService.throwToStart(ctx);
                }
                user!.last_state = "finish";
                await user!.save();
                const res =
                  `<b>Foydalanuvchidan savol.</b>\n\n` +
                  userInput +
                  `\n\n${user!.name} ${user!.username ? `(@${user!.username})` : ""}|${user!.phone_number}) dan`;

                await this.bot.telegram.sendMessage(
                  Number(process.env.ADMIN!),
                  res,
                  {
                    parse_mode: "HTML",
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: `Javob berish`,
                            callback_data: `responsetouser_${process.env.ADMIN!}_${user?.user_id}`,
                          },
                        ],
                      ],
                    },
                  }
                );
                ctx.replyWithHTML(
                  "📤 So'rovingiz adminga yuborildi, adminlar tez orada so'rovingizni ko'rib chiqib javob yozishadi. 🔜",
                  {
                    ...Markup.keyboard(usersMainButtons).resize(),
                  }
                );
                break;
            }
          }
        }
      } catch (error) {
        console.log(`Error on Text`, error);
      }
    }
  }
  async onMessage(ctx: Context) {
    if (ctx.message?.chat.type == "private") {
      try {
        const user_id = String(ctx.from?.id);
        const user = await this.staffModel.findOne({ where: { user_id } });

        if (!user) return this.staffService.throwToStart(ctx);

        if (
          ctx.from?.id == Number(process.env.ADMIN!) &&
          user.last_state.startsWith("responsetouser_")
        ) {
          const ustaId = user.last_state.split("_")[1];

          //Shotga keldim yana tuzatishim kere
          if ("photo" in ctx.message!) {
            // Foto yuborsa
            const photo =
              ctx.message.photo[ctx.message.photo.length - 1].file_id;
            await this.bot.telegram.sendPhoto(Number(ustaId), photo, {
              caption: `🖼 Admindan foto keldi \n${ctx.message.caption ? ctx.message.caption : ""}`,
            });
            user.last_state = "";
            await user.save();
            await ctx.replyWithHTML("Xabar foydalanuvchiga yuborildi.", {
              ...Markup.keyboard(adminMainButtons).resize(),
            });
          } else if ("video" in ctx.message!) {
            // Video yuborsa
            const video = ctx.message.video.file_id;
            await this.bot.telegram.sendVideo(Number(ustaId), video, {
              caption: `🎥 Admindan video keldi \n${ctx.message.caption ? ctx.message.caption : ""}`,
            });
            user.last_state = "";
            await user.save();
            await ctx.replyWithHTML("Xabar foydalanuvchiga yuborildi.", {
              ...Markup.keyboard(adminMainButtons).resize(),
            });
          } else {
            await ctx.reply(
              "❗Faqat matn, rasm yoki video yuborishingiz mumkin."
            );
          }
        }

        // faqat writeToAdmin holatida ishlaydi
        if (user.last_state === "writeToAdmin") {
          if ("photo" in ctx.message!) {
            // Foto yuborsa
            user!.last_state = "finish";
            await user.save();
            const photo =
              ctx.message.photo[ctx.message.photo.length - 1].file_id;
            await this.bot.telegram.sendPhoto(
              Number(process.env.ADMIN!),
              photo,
              {
                caption: `🖼 Foydalanuvchidan foto keldi 
                \n${ctx.message.caption ? ctx.message.caption : ""}
                \n${user!.name} ${user!.username ? `(@${user!.username})` : ""}|${user!.phone_number}) dan`,
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: `Javob berish`,
                        callback_data: `responsetouser_${process.env.ADMIN!}_${user?.user_id}`,
                      },
                    ],
                  ],
                },
              }
            );
            ctx.replyWithHTML(
              "📤 So'rovingiz adminga yuborildi, adminlar tez orada so'rovingizni ko'rib chiqib javob yozishadi. 🔜",
              {
                ...Markup.keyboard(usersMainButtons).resize(),
              }
            );
          } else if ("video" in ctx.message!) {
            // Video yuborsa
            user!.last_state = "finish";
            await user.save();
            const video = ctx.message.video.file_id;
            await this.bot.telegram.sendVideo(
              Number(process.env.ADMIN!),
              video,
              {
                caption: `🎥 Foydalanuvchidan video keldi
                \n${ctx.message.caption ? ctx.message.caption : ""}
                \n${user!.name} ${user!.username ? `(@${user!.username})` : ""}|${user!.phone_number}) dan`,
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: `Javob berish`,
                        callback_data: `responsetouser_${process.env.ADMIN!}_${user?.user_id}`,
                      },
                    ],
                  ],
                },
              }
            );
            ctx.replyWithHTML(
              "📤 So'rovingiz adminlarga yuborildi, adminlar tez orada so'rovingizni ko'rib chiqib javob yozishadi. 🔜",
              {
                ...Markup.keyboard(usersMainButtons).resize(),
              }
            );
          } else {
            await ctx.reply(
              "❗Faqat matn, rasm yoki video yuborishingiz mumkin."
            );
          }
        }
      } catch (error) {
        console.log(`Error on Message User`, error);
      }
    }
  }
  //---------------------------- Contact Button --------------------------
  //===
  // await ctx.reply("Telefon raqamingizni kiriting:", {
  //   ...Markup.keyboard([
  //     [Markup.button.contactRequest("Telefon raqam yuborish")],
  //   ])
  //     .oneTime()
  //     .resize(),
  // });

  // ---------------------------------Staff-------------------------------

  // ---------------------------------Admin-------------------------------
  async admin_menu(ctx: Context, menu_text = `<b>Admin menusi</b>`) {
    try {
      await ctx.reply(menu_text, {
        parse_mode: "HTML",
        ...Markup.keyboard(adminMainButtons).oneTime().resize(),
      });
    } catch (error) {
      console.log("Admin man_u sida xatolik", error);
    }
  }
}
