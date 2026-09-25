import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    text,
    date,
    customType
} from "drizzle-orm/pg-core";

const bytea = customType<{
    data: Buffer;
    driverData: Buffer;
}>({
    dataType() {
        return "bytea";
    }
});

export const schools = pgTable("schools", {
    id: serial("id").primaryKey(),
    schoolName: varchar("school_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255}),
    contactPhone: varchar("contact_phone", { length: 50 }),
    contactEmail: varchar("contact_email", { length: 255}),
    logoUrl: varchar("logo_url", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true}).defaultNow().notNull()
});

export const students = pgTable("students", {
    id: serial("id").primaryKey(), schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    academicYear: varchar("academic_year", { length: 20 }),
    status: varchar("status", { length: 50 })
});


export const protocols = pgTable("protocols", {
    id: serial("id").primaryKey(),
    organization: varchar("organization", { length: 255 }).notNull(),
    representative: varchar("representative", { length: 255 }),
    date: date("date").notNull(),
    phonenumber: varchar("phonenumber", { length: 50 }),
    pdf: bytea("pdf"),
    createdAt: timestamp("createdat", { withTimezone: false }).defaultNow(),
    updatedAt: timestamp("updatedat", { withTimezone: false }).defaultNow(),
    status: varchar("status", {length: 20 }).notNull().default("Not Signed")
});