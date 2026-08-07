import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Role } from "../generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const mainBranchName = "Main Branch";
const mohammadiaMasjidBranchName = "Mohammadia Masjid";
const mainBatchNames = ["Zuhr to Asr", "Asr to Isha", "Asr to Maghrib to Isha"] as const;
const mohammadiaMasjidBatchNames = ["Asr to Maghrib to isha", "Asr to Maghrib"] as const;
const seedPassword = "AlKitaab@2026";
const batchKey = (branchName: string, batchName: string) => `${branchName}::${batchName}`;

const teachers = [
  { name: "Ustadh Ahmed Khan", email: "ahmed.khan@alkitaab.test", phone: "9000000001", batches: [batchKey(mainBranchName, mainBatchNames[0])] },
  { name: "Ustadh Bilal Siddiqui", email: "bilal.siddiqui@alkitaab.test", phone: "9000000002", batches: [batchKey(mainBranchName, mainBatchNames[1])] },
  { name: "Ustadh Danish Ali", email: "danish.ali@alkitaab.test", phone: "9000000003", batches: [batchKey(mainBranchName, mainBatchNames[2])] },
  { name: "Ustadh Faisal Rahman", email: "faisal.rahman@alkitaab.test", phone: "9000000004", batches: [batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[0])] },
  { name: "Ustadha Nida Farooq", email: "nida.farooq@alkitaab.test", phone: "9000000005", batches: [batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[1])] },
] as const;

const students = [
  ["Ayaan Khan", "ayaan.khan@alkitaab.test", "9100000001", batchKey(mainBranchName, mainBatchNames[0])],
  ["Zayan Ahmed", "zayan.ahmed@alkitaab.test", "9100000002", batchKey(mainBranchName, mainBatchNames[0])],
  ["Muhammad Ibrahim", "ibrahim@alkitaab.test", "9100000003", batchKey(mainBranchName, mainBatchNames[0])],
  ["Yusuf Ansari", "yusuf.ansari@alkitaab.test", "9100000004", batchKey(mainBranchName, mainBatchNames[0])],
  ["Rayyan Malik", "rayyan.malik@alkitaab.test", "9100000005", batchKey(mainBranchName, mainBatchNames[0])],
  ["Hamza Farooq", "hamza.farooq@alkitaab.test", "9100000006", batchKey(mainBranchName, mainBatchNames[0])],
  ["Fatima Zahra", "fatima.zahra@alkitaab.test", "9100000007", batchKey(mainBranchName, mainBatchNames[0])],
  ["Maryam Noor", "maryam.noor@alkitaab.test", "9100000008", batchKey(mainBranchName, mainBatchNames[1])],
  ["Aisha Siddiqua", "aisha.siddiqua@alkitaab.test", "9100000009", batchKey(mainBranchName, mainBatchNames[1])],
  ["Safiya Rahman", "safiya.rahman@alkitaab.test", "9100000010", batchKey(mainBranchName, mainBatchNames[1])],
  ["Khadija Ali", "khadija.ali@alkitaab.test", "9100000011", batchKey(mainBranchName, mainBatchNames[1])],
  ["Sumaiya Khan", "sumaiya.khan@alkitaab.test", "9100000012", batchKey(mainBranchName, mainBatchNames[1])],
  ["Hafsa Begum", "hafsa.begum@alkitaab.test", "9100000013", batchKey(mainBranchName, mainBatchNames[1])],
  ["Abdullah Qureshi", "abdullah.qureshi@alkitaab.test", "9100000014", batchKey(mainBranchName, mainBatchNames[1])],
  ["Omar Faris", "omar.faris@alkitaab.test", "9100000015", batchKey(mainBranchName, mainBatchNames[2])],
  ["Ismail Khan", "ismail.khan@alkitaab.test", "9100000016", batchKey(mainBranchName, mainBatchNames[2])],
  ["Ilyas Ahmed", "ilyas.ahmed@alkitaab.test", "9100000017", batchKey(mainBranchName, mainBatchNames[2])],
  ["Amina Yusuf", "amina.yusuf@alkitaab.test", "9100000018", batchKey(mainBranchName, mainBatchNames[2])],
  ["Ruqayya Noor", "ruqayya.noor@alkitaab.test", "9100000019", batchKey(mainBranchName, mainBatchNames[2])],
  ["Sara Mahmood", "sara.mahmood@alkitaab.test", "9100000020", batchKey(mainBranchName, mainBatchNames[2])],
  ["Arman Siddiqui", "arman.siddiqui@alkitaab.test", "9100000021", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[0])],
  ["Salman Qadri", "salman.qadri@alkitaab.test", "9100000022", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[0])],
  ["Taha Khan", "taha.khan@alkitaab.test", "9100000023", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[0])],
  ["Musa Rehman", "musa.rehman@alkitaab.test", "9100000024", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[0])],
  ["Usman Ali", "usman.ali@alkitaab.test", "9100000025", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[0])],
  ["Hira Fatima", "hira.fatima@alkitaab.test", "9100000026", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[0])],
  ["Noorain Ahmed", "noorain.ahmed@alkitaab.test", "9100000027", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[1])],
  ["Mariam Iqbal", "mariam.iqbal@alkitaab.test", "9100000028", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[1])],
  ["Aleena Khan", "aleena.khan@alkitaab.test", "9100000029", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[1])],
  ["Laiba Noor", "laiba.noor@alkitaab.test", "9100000030", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[1])],
  ["Sana Farooq", "sana.farooq@alkitaab.test", "9100000031", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[1])],
  ["Areeba Hassan", "areeba.hassan@alkitaab.test", "9100000032", batchKey(mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames[1])],
] as const;

async function main() {
  const password = await bcrypt.hash(seedPassword, 10);

  const batches = new Map<string, string>();
  for (const [branchName, batchNames] of [
    [mainBranchName, mainBatchNames],
    [mohammadiaMasjidBranchName, mohammadiaMasjidBatchNames],
  ] as const) {
    const branch = await prisma.branch.upsert({
      where: { name: branchName },
      update: {},
      create: { name: branchName },
    });

    for (const name of batchNames) {
      const batch = await prisma.batch.upsert({
        where: { branchId_name: { branchId: branch.id, name } },
        update: {},
        create: { name, branchId: branch.id },
      });
      batches.set(batchKey(branchName, name), batch.id);
    }
  }

  for (const teacher of teachers) {
    const user = await prisma.user.upsert({
      where: { email: teacher.email },
      update: { name: teacher.name, phone: teacher.phone, role: Role.TEACHER },
      create: {
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        password,
        role: Role.TEACHER,
      },
    });
    const profile = await prisma.teacher.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });

    for (const batchName of teacher.batches) {
      await prisma.teacherAssignment.upsert({
        where: { teacherId_batchId: { teacherId: profile.id, batchId: batches.get(batchName)! } },
        update: {},
        create: { teacherId: profile.id, batchId: batches.get(batchName)! },
      });
    }
  }

  for (const [name, email, phone, batchName] of students) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, phone, role: Role.STUDENT },
      create: { name, email, phone, password, role: Role.STUDENT },
    });
    const profile = await prisma.student.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
    const batchId = batches.get(batchName)!;
    await prisma.studentEnrollment.upsert({
      where: { studentId_batchId: { studentId: profile.id, batchId } },
      update: {},
      create: { studentId: profile.id, batchId },
    });
  }

  console.log(`Initialized 2 branches, ${batches.size} batches, ${teachers.length} teachers, and ${students.length} students.`);
  console.log(`Seed account password: ${seedPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
