export type School = {
	id: number;
	schoolName: string;
	contactName: string | null;
	contactPhone: string | null;
	contactEmail: string | null;
	logoUrl: string | null;
	createdAt: string;
};

export type Students = {
	id: number;
    name: string;
    phone: string | null;
    schoolId: number;
    academicYear: string | null;
    status: any;
    createdAt: string;
};

export interface Protocol {
    id: number;
    organization: string;
    representative: string | null;
    date: string;
    phonenumber: string | null;
    pdf: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    status: string;
}