import crypto from 'crypto';
export async function generate(user){
    const userId = user._id;
    const userEmail = user.email;
    const resetToken = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment()
        .add(2, 'hours')
        .toDate();
    const ResetTokenObject = new PasswordResetToken({
        resetToken,
        userId,
        userEmail,
        expires,
    });
    await ResetTokenObject.save();
    return ResetTokenObject;
}