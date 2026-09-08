import AuthVerify from '@/app/ServerActions/auth/authVerify'


import {
  Users,
  UsersRound,
  CheckCircle2,
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from '@/lib/prisma';

type StatCard = {
  label: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
};

const totalstudents=await prisma.student.count();
const totalteachers=await prisma.teacher.count();

const stats: StatCard[] = [
  { label: "Total Students", value: totalstudents, icon: Users, iconColor: "text-chart-1" },
  { label: "Total Teachers", value: totalteachers, icon: UsersRound, iconColor: "text-chart-2" },
  { label: "Active Students", value: 13, icon: CheckCircle2, iconColor: "text-primary" },
  { label: "Classes", value: 7, icon: BookOpen, iconColor: "text-chart-3" },
  { label: "Ongoing Lessons", value: 4, icon: BookOpenCheck, iconColor: "text-chart-4" },
  { label: "Pending Assignments", value: 13, icon: ClipboardList, iconColor: "text-chart-5" },
];

type Activity = {
  title: string;
  timestamp: string;
  actor: string;
};

const recentActivity: Activity[] = [
  {
    title: "New student Ruqayyah Aziz enrolled in Arabic Language Beginner",
    timestamp: "7/30/2026, 4:54:52 PM",
    actor: "Admin",
  },
  {
    title: "Arabic Alphabet Practice marked as completed by Sheikh Omar Farooq",
    timestamp: "7/30/2026, 2:54:52 PM",
    actor: "Sheikh Omar Farooq",
  },
  {
    title: "Tajweed Rules lesson started in Hifz Class A",
    timestamp: "7/30/2026, 12:54:52 PM",
    actor: "Maulana Abdul Rahman",
  },
];

const suggestedQuestions = [
  "What is the overall attendance rate?",
  "Which students need attention?",
];

export default async function DashboardPage() {
  await AuthVerify("ADMIN");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="flex flex-col gap-3 p-5 shadow-none"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} strokeWidth={1.75} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent activity + AI assistant */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="p-5 shadow-none">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          <div className="divide-y">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{activity.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.timestamp} • {activity.actor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Assistant */}
        <Card className="flex flex-col p-0 shadow-none">
          <div className="flex items-center gap-2.5 border-b px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-semibold leading-tight">Madrasa AI Assistant</p>
              <p className="text-xs text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-6 w-6 text-primary" strokeWidth={1.75} />
            </div>
            <p className="font-semibold">Ask me anything about your madrasa</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              I have full knowledge of students, teachers, attendance,
              lessons, and assignments.
            </p>

            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((q) => (
                <Badge
                  key={q}
                  variant="outline"
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-normal hover:bg-muted"
                >
                  {q}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
