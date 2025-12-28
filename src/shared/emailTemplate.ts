import {IAdminAppointmentAlert, IPartnerDateNightAlert,  IContact, ICreateAccount, IHelpContact, IPartnerInvite, IPartnerRequest, IResetPassword, IResetPasswordByEmail, } from '../types/emailTamplate';

const createAccount = (values: ICreateAccount) => {
     const data = {
          to: values.email,
          subject: 'Verify your account',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
  <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
    <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
    <h2 style="color: #636AE8; font-size: 24px; margin-bottom: 20px;">Hey! ${values.name}, Your Account Credentials</h2>
    <div style="text-align: center;">
      <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
      <div style="background-color: #636AE8; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">
        ${values.otp}
      </div>
      <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 15 minutes.</p>
    </div>
  </div>
</body>
`,
     };
     return data;
};
const resetPassword = (values: IResetPassword) => {
     const data = {
          to: values.email,
          subject: 'Reset your password',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #636AE8; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 15 minutes.</p>
                <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;text-align:left">If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
        </div>
    </div>
</body>`,
     };
     return data;
};
const resetPasswordByUrl = (values: IResetPasswordByEmail) => {
     const data = {
          to: values.email,
          subject: 'Reset Your Password',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${values.resetUrl}" target="_blank" style="display: inline-block; background-color: #636AE8; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 18px; margin: 20px auto;">Reset Password</a>
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">If you didn’t request this, you can ignore this email.</p>
          <p style="color: #b9b4b4; font-size: 14px;">This link will expire in 15 minutes.</p>
        </div>
      </div>
    </body>`,
     };
     return data;
};
const partnerInvite = (values: IPartnerInvite) => {
     const data = {
          to: values.email,
          subject: `${values.inviterName} invited you to be their partner on OurApp`,
          html: `
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
            <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
                <h2 style="color: #636AE8; font-size: 24px; margin-bottom: 20px;">Hi ${values.name}, You've been invited by ${values.inviterName}!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">You’ve been invited to be ${values.inviterName}'s partner on OurApp. Here are your login credentials:</p>
                <div style="background-color: #636AE8; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.password}</div>
                <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Use this password to log in and complete your profile.</p>
                <p style="color: #b9b4b4; font-size: 16px; text-align: center;">If you didn’t request this, you can ignore this email.</p>
            </div>
        </body>`,
     };
     return data;
};
const partnerRequest = (values: IPartnerRequest) => {
     const data = {
          to: values.email,
          subject: `${values.inviterName} wants to make you their partner on OurApp`,
          html: `
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
            <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
                <h2 style="color: #636AE8; font-size: 24px; margin-bottom: 20px;">Hi ${values.name},</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">${values.inviterName} wants to make you their partner on OurApp as a ${values.relation}. Please review and respond to this request.</p>
                <p style="color: #b9b4b4; font-size: 16px; text-align: center;">If you didn’t request this, you can ignore this email.</p>
            </div>
        </body>`,
     };
     return data;
};
const monthlySummary = (values: { email: string; name: string; month: string; income: number; budget: number; expenses: number; disposable: number }) => {
     const data = {
          to: values.email,
          subject: `${values.month} Financial Summary`,
          html: `
      <body style="font-family: Arial, sans-serif; background-color:#f9f9f9; margin:40px; padding:20px; color:#555;">
        <div style="width:100%; max-width:600px; margin:0 auto; padding:20px; background:#fff;
          border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1);">
          <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo"
            style="display:block; margin:0 auto 20px; width:150px;" />
          <h2 style="color:#636AE8; font-size:24px; text-align:center; margin-bottom:20px;">
            ${values.month} Financial Summary for ${values.name}
          </h2>

          <div style="background-color:#f4f4f4; padding:15px; border-radius:8px;">
            <p style="font-size:16px;"><strong>Income:</strong> $${values.income}</p>
            <p style="font-size:16px;"><strong>Budget:</strong> $${values.budget}</p>
            <p style="font-size:16px;"><strong>Expenses:</strong> $${values.expenses}</p>
            <hr style="border:none; border-top:1px solid #ddd; margin:10px 0;">
            <p style="font-size:16px; color:#636AE8;"><strong>Disposable Income:</strong> $${values.disposable}</p>
          </div>

          <p style="font-size:15px; text-align:center; margin-top:20px;">
            Keep tracking your finances and make informed decisions for a better month ahead!
          </p>
          <p style="color:#b9b4b4; font-size:13px; text-align:center; margin-top:20px;">This summary was generated automatically.</p>
        </div>
      </body>`,
     };
     return data;
};
const expensesExceedIncome = (values: { email: string; name: string; income: number; totalExpenses: number }) => {
     const data = {
          to: values.email,
          subject: `Your Expenses Are Higher Than Your Income`,
          html: `
      <body style="font-family: Arial, sans-serif; background-color:#f9f9f9; margin:40px; padding:20px; color:#555;">
        <div style="width:100%; max-width:600px; margin:0 auto; padding:20px; background:#fff;
          border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); text-align:center;">
          <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo"
            style="display:block; margin:0 auto 20px; width:150px;" />
          <h2 style="color:#636AE8; font-size:24px; margin-bottom:20px;">Hey ${values.name},</h2>
          <p style="font-size:16px; line-height:1.5;">We noticed your total monthly expenses (<strong>$${values.totalExpenses}</strong>) have exceeded your income (<strong>$${values.income}</strong>).</p>
          <p style="font-size:16px;">Consider reducing spending or updating your budget to stay on track financially.</p>
          <p style="color:#b9b4b4; font-size:14px; margin-top:20px;">Generated automatically by your finance tracker.</p>
        </div>
      </body>`,
     };
     return data;
};
const budgetExceedsIncome = (values: { email: string; name: string; income: number; totalBudget: number }) => {
     const data = {
          to: values.email,
          subject: `Your Budget Exceeds Your Income`,
          html: `
      <body style="font-family: Arial, sans-serif; background-color:#f9f9f9; margin:40px; padding:20px; color:#555;">
        <div style="width:100%; max-width:600px; margin:0 auto; padding:20px; background:#fff;
          border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); text-align:center;">
          <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo"
            style="display:block; margin:0 auto 20px; width:150px;" />
          <h2 style="color:#636AE8; font-size:24px; margin-bottom:20px;">Hi ${values.name},</h2>
          <p style="font-size:16px; line-height:1.5;">Your total monthly budget (<strong>$${values.totalBudget}</strong>) is higher than your income (<strong>$${values.income}</strong>).</p>
          <p style="font-size:16px;">We recommend adjusting your budget to maintain a healthy balance.</p>
          <p style="color:#b9b4b4; font-size:14px; margin-top:20px;">This is an automated financial alert.</p>
        </div>
      </body>`,
     };
     return data;
};
const subscriptionEvent = (values: { email: string; name: string; status: 'active' | 'canceled' | 'failed' | 'renewal' | 'phase_changed'; planName: string; nextBillingDate?: string }) => {
     const eventMessages: Record<typeof values.status, string> = {
          active: `Your subscription for <strong>${values.planName}</strong> is now active! 🎉`,
          canceled: `Your subscription for <strong>${values.planName}</strong> has been canceled.`,
          failed: `We couldn’t process your latest payment for <strong>${values.planName}</strong>. Please update your payment method.`,
          renewal: `Your subscription for <strong>${values.planName}</strong> has been successfully renewed.`,
          phase_changed: `Your subscription for <strong>${values.planName}</strong> has moved to a new phase.`,
     };

     const data = {
          to: values.email,
          subject: `Subscription Update: ${values.planName}`,
          html: `
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 40px; padding: 20px; color: #555;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff;
          border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
          <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo"
            style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #636AE8; font-size: 24px; margin-bottom: 20px;">Hi ${values.name},</h2>
          <p style="font-size: 16px; line-height: 1.5;">${eventMessages[values.status]}</p>
          ${values.nextBillingDate ? `<p style="color:#555;font-size:15px;">Next Billing Date: <strong>${values.nextBillingDate}</strong></p>` : ''}
          <p style="color:#b9b4b4; font-size: 14px; margin-top: 20px;">If you didn’t make this change, please contact support immediately.</p>
        </div>
      </body>`,
     };
     return data;
};


const partnerDateNightAlert = (values: IPartnerDateNightAlert) => {
     const data = {
          to: values.email,
          subject: values.title,
          html: `
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px; color: #555;">
  <div style="width: 100%; max-width: 600px; margin: 50px auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
    
    <img 
      src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" 
      alt="Logo" 
      style="display: block; margin: 0 auto 20px; width:150px;" 
    />

    <h2 style="color: #636AE8; font-size: 24px; margin-bottom: 10px;">
      Hey ${values.partnerName} 💕
    </h2>

    <h3 style="color: #333; font-size: 20px; margin-bottom: 10px;">
      ${values.name} planned a Date Night!
    </h3>

    <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
      ${values.message}
    </p>

    <!-- Details Card -->
    <div style="background-color: #f4f5ff; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: left;">
      <p style="margin: 8px 0; font-size: 15px;">
        📍 <strong>Location:</strong> ${values.location}
      </p>
      <p style="margin: 8px 0; font-size: 15px;">
        ❤️ <strong>Couple:</strong> ${values.name} & ${values.partnerName}
      </p>
    </div>

    <div style="background-color: #636AE8; color: #fff; padding: 15px; border-radius: 8px; font-size: 16px;">
      Get ready for a special moment together ✨
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #999;">
      Open the app to view more details.
    </p>
  </div>
</body>
`,
     };
     return data;
};

const adminAppointmentAlert = (values: IAdminAppointmentAlert) => {
  return {
    to: values.adminEmail,
    subject: `New Appointment Created by ${values.userName}`,
    html: `
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
  <div style="width: 100%; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">

    <img src="https://rehoapp.lon1.digitaloceanspaces.com/image/a36a9f50-3237-4517-b7c9-5d6bbde894cb.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />

    <h2 style="color: #636AE8; font-size: 24px; text-align: center; margin-bottom: 20px;">
      New Appointment Created
    </h2>

    <p style="font-size: 16px; margin-bottom: 15px;">A new appointment has been created by <strong>${values.userName}</strong> (${values.userEmail}).</p>

    <div style="background-color: #f4f5ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p><strong>Title:</strong> ${values.title}</p>
      <p><strong>Phone Number:</strong> ${values.number}</p>
      <p><strong>Best Contact Method:</strong> ${values.bestContact}</p>
      <p><strong>Attendant:</strong> ${values.attendant}</p>
      <p><strong>Is Child:</strong> ${values.isChild ? 'Yes' : 'No'}</p>
      <p><strong>Approx Income:</strong> $${values.approxIncome}</p>
      <p><strong>Investment:</strong> $${values.investment}</p>
      ${values.discuss ? `<p><strong>Discuss:</strong> ${values.discuss}</p>` : ''}
      <p><strong>Reaching For:</strong> ${values.reachingFor}</p>
      <p><strong>Ask:</strong> ${values.ask}</p>
      <p><strong>Date:</strong> ${values.date}</p>
      <p><strong>Time Slot:</strong> ${values.timeSlot}</p>
    </div>

    <p style="font-size: 14px; color: #999; text-align: center;">
      Please review the appointment in the admin panel.
    </p>

  </div>
</body>
`,
  };
};



export const emailTemplate = {
     createAccount,
     resetPassword,
     resetPasswordByUrl,
     partnerInvite,
     partnerRequest,
     monthlySummary,
     expensesExceedIncome,
     budgetExceedsIncome,
     subscriptionEvent,
     partnerDateNightAlert,
     adminAppointmentAlert     
};
