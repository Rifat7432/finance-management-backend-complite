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
