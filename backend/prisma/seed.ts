import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* Seeds a demo user so reviewers can log in immediately:
     email:    demo@designli.co
     password: password123
*/
async function main() {
  const email = "demo@designli.co";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  // A couple of example alerts.
  const existing = await prisma.alert.count({ where: { userId: user.id } });
  if (existing === 0) {
    await prisma.alert.createMany({
      data: [
        { symbol: "AAPL", targetPrice: 250, direction: "ABOVE", userId: user.id },
        { symbol: "TSLA", targetPrice: 150, direction: "BELOW", userId: user.id },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user: ${email} / password123`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
