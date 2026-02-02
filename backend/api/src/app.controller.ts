import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Doptor API is running! 🚀";
  }

  @Get("health")
  getHealth(): { status: string } {
    return { status: "ok" };
  }
}
