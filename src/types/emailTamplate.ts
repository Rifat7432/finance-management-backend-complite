export type ICreateAccount = {
     name: string;
     email: string;
     otp: number;
};

export type IResetPassword = {
     email: string;
     otp: number;
};
export interface IResetPasswordByEmail {
     email: string;
     resetUrl: string;
}
export interface IHelpContact {
     name: string;
     email: string;
     phone?: string;
     read: boolean;
     message: string;
}
export type IContact = {
     name: string;
     email: string;
     subject: string;
     message: string;
};
export type IPartnerInvite = {
     name: string;
     inviterName: string;
     email: string;
     password: string;
};
export type IPartnerRequest = {
     email: string;
     name: string;
     inviterName: string;
     relation: string;
     requestId: string;
};
export type IPartnerDateNightAlert = {
     email: string;
     name: string; // receiver name
     partnerName: string; // partner who created the date night
     title: string;
     message: string;
     location: string;
};


export type IAdminAppointmentAlert = {
  adminEmail: string;
  userName: string;
  userEmail: string;
  title: string;
  number: string;
  bestContact: string;
  attendant: string;
  isChild: boolean;
  approxIncome: number;
  investment: number;
  discuss?: string;
  reachingFor: string;
  ask: string;
  date: string;
  timeSlot: string;
}