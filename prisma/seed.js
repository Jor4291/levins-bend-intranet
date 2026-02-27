const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ensureUser({ email, firstName, lastName, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, firstName, lastName, passwordHash },
  });
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "levins-bend" },
    update: { name: "Levin's Bend Condominiums" },
    create: { name: "Levin's Bend Condominiums", slug: "levins-bend" },
  });

  const adminUser = await ensureUser({
    email: "admin@levinsbend.org",
    firstName: "Board",
    lastName: "Admin",
    password: "Welcome2026!",
  });

  const residentUser = await ensureUser({
    email: "resident@levinsbend.org",
    firstName: "Taylor",
    lastName: "Harper",
    password: "Welcome2026!",
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: organization.id,
      },
    },
    update: { role: "ORG_ADMIN" },
    create: {
      userId: adminUser.id,
      organizationId: organization.id,
      role: "ORG_ADMIN",
    },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: residentUser.id,
        organizationId: organization.id,
      },
    },
    update: { role: "MEMBER" },
    create: {
      userId: residentUser.id,
      organizationId: organization.id,
      role: "MEMBER",
    },
  });

  const announcements = [
    {
      title: "Board Meeting: March 12, 6:30 PM",
      content:
        "The Levin's Bend board will meet in the Community Lounge. Agenda: spring landscaping, pool reopening, and marina security updates.",
      isPinned: true,
    },
    {
      title: "Pool Deck Reopens April 1",
      content:
        "Fresh furniture and new lighting are in place. Please follow posted hours and keep guests accompanied.",
      isPinned: true,
    },
    {
      title: "Garage Access Reminder",
      content:
        "For safety, please do not hold garage doors open. Report any access issues to the front office.",
      isPinned: false,
    },
    {
      title: "Waterfront Grill Reservation Calendar",
      content:
        "Residents can reserve the grill area two weeks in advance. Submit requests through the Events calendar.",
      isPinned: false,
    },
    {
      title: "Package Room Hours Updated",
      content:
        "The package room is now open 8:00 AM – 8:00 PM daily. Please bring photo ID.",
      isPinned: false,
    },
  ];

  const existingAnnouncements = await prisma.announcement.findMany({
    where: {
      organizationId: organization.id,
      title: { in: announcements.map((item) => item.title) },
    },
    select: { title: true },
  });

  const existingAnnouncementTitles = new Set(
    existingAnnouncements.map((item) => item.title)
  );

  for (const announcement of announcements) {
    if (existingAnnouncementTitles.has(announcement.title)) continue;
    await prisma.announcement.create({
      data: {
        ...announcement,
        authorId: adminUser.id,
        organizationId: organization.id,
      },
    });
  }

  const now = new Date();
  const events = [
    {
      title: "Sunset Social on the Marina",
      description:
        "Join neighbors for light bites and live acoustic music by the marina.",
      location: "Marina Promenade",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 18, 30),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 20, 0),
      isAllDay: false,
    },
    {
      title: "Monthly Board Meeting",
      description: "Community updates and resident Q&A.",
      location: "Community Lounge",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 18, 30),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 20, 0),
      isAllDay: false,
    },
    {
      title: "Pool Deck Maintenance",
      description: "Temporary closure for cleaning and touch-ups.",
      location: "Pool Deck",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12, 8, 0),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12, 14, 0),
      isAllDay: false,
    },
    {
      title: "Residents Yoga",
      description: "Bring a mat and water. All levels welcome.",
      location: "Fitness Studio",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 7, 30),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 8, 30),
      isAllDay: false,
    },
    {
      title: "Fire Alarm Inspection",
      description: "Annual inspection of fire safety systems.",
      location: "All buildings",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15, 9, 0),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15, 12, 0),
      isAllDay: false,
    },
  ];

  const existingEvents = await prisma.event.findMany({
    where: {
      organizationId: organization.id,
      title: { in: events.map((item) => item.title) },
    },
    select: { title: true },
  });

  const existingEventTitles = new Set(existingEvents.map((item) => item.title));

  for (const event of events) {
    if (existingEventTitles.has(event.title)) continue;
    await prisma.event.create({
      data: {
        ...event,
        createdById: adminUser.id,
        organizationId: organization.id,
      },
    });
  }

  const requests = [
    {
      title: "Leaky kitchen faucet",
      description:
        "The kitchen faucet drips constantly. Please schedule a repair this week.",
      unit: "12B",
      priority: "NORMAL",
      status: "OPEN",
      submittedById: residentUser.id,
    },
    {
      title: "Balcony light flickering",
      description:
        "Exterior balcony light flickers and sometimes fails to turn on.",
      unit: "7A",
      priority: "LOW",
      status: "IN_PROGRESS",
      submittedById: residentUser.id,
    },
    {
      title: "AC filter replacement",
      description:
        "Requesting a seasonal filter replacement and airflow check.",
      unit: "19C",
      priority: "NORMAL",
      status: "RESOLVED",
      submittedById: residentUser.id,
    },
    {
      title: "Garage gate sensor issue",
      description:
        "Gate sensor is slow to respond in the evenings. Please inspect.",
      unit: null,
      priority: "HIGH",
      status: "OPEN",
      submittedById: adminUser.id,
    },
    {
      title: "Elevator inspection follow-up",
      description:
        "Elevator 2 has a delayed door close. Technician follow-up needed.",
      unit: null,
      priority: "URGENT",
      status: "IN_PROGRESS",
      submittedById: adminUser.id,
    },
    {
      title: "Pool shower leak",
      description:
        "Pool deck shower is leaking at the base. Please tighten or reseal.",
      unit: null,
      priority: "LOW",
      status: "CLOSED",
      submittedById: adminUser.id,
    },
  ];

  const existingRequests = await prisma.maintenanceRequest.findMany({
    where: {
      organizationId: organization.id,
      title: { in: requests.map((item) => item.title) },
    },
    select: { title: true },
  });

  const existingRequestTitles = new Set(
    existingRequests.map((item) => item.title)
  );

  for (const request of requests) {
    if (existingRequestTitles.has(request.title)) continue;
    await prisma.maintenanceRequest.create({
      data: {
        title: request.title,
        description: request.description,
        unit: request.unit,
        priority: request.priority,
        status: request.status,
        submittedById: request.submittedById,
        organizationId: organization.id,
      },
    });
  }

  console.log("Seeded demo data for Levin's Bend.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
