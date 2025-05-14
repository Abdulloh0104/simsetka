import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from "nestjs-telegraf";
import { Markup, Context } from "telegraf";
import { BotService } from "../bot.service";
import { StaffService } from "./staff.service";

@Update()
export class StaffUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly staffService: StaffService
  ) {}

  @Action(/^loc_+\d+/)
  async onClickLocation(@Ctx() ctx: Context) {
    await this.staffService.onClickLocation(ctx);
  }

  @Hears("RO'YXATDAN O'TISH")
  async onClickRegister(@Ctx() ctx: Context) {
    return this.staffService.onClickRegister(ctx);
  }

  @Hears("Usta")
  async onNewStaff(@Ctx() ctx: Context) {
    return this.staffService.onNewStaff(ctx);
  }

  // @Hears("Mijoz")
  // async onNewClient(@Ctx() ctx: Context) {
  //   return this.staffService.onNewStaff(ctx);
  // }

  @Hears("Yangi manzil qo'shish")
  async onNewAddress(@Ctx() ctx: Context) {
    return this.staffService.onNewStaff(ctx);
  }

  // @Hears("Mening xodimlarim")
  // async onMyAddresses(@Ctx() ctx: Context) {
  //   return this.staffService.onMyAddresses(ctx);
  // }

  @Action(/^occ_+\d+_+[A-Z]+/)
  async onClickOccupation(@Ctx() ctx: Context) {
    await this.staffService.onClickOccupation(ctx);
  }

  @Hears("✅ TASDIQLASH")
  async onApproved(@Ctx() ctx: Context) {
    return this.staffService.onApproved(ctx);
  }

  @Hears("❌ BEKOR QILISH")
  async onCancel(@Ctx() ctx: Context) {
    return this.staffService.onCancel(ctx);
  }

  @Hears("TEKSHIRISH")
  async onCheck(@Ctx() ctx: Context) {
    return this.staffService.onCheck(ctx);
  }

  @Action(/^app_+\d+/)
  async onClickApproved(@Ctx() ctx: Context) {
    await this.staffService.onClickApproved(ctx);
  }

  @Action(/^del_+\d+/)
  async onClickDelete(@Ctx() ctx: Context) {
    await this.staffService.onClickDelete(ctx);
  }

  
}
