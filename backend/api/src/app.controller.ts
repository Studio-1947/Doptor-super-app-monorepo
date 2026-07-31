import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Doptor API is running! 🚀";
  }

  // Exempt from rate limiting. Uptime monitors and the deploy's own health
  // check poll this on a fixed interval from one address — exactly the shape
  // the throttler exists to reject. Throttling it would make a monitor report
  // an outage that is not happening.
  @SkipThrottle()
  @Get("health")
  getHealth(): { status: string } {
    return { status: "ok" };
  }
}
