import crypto from 'crypto';
export function generate(user) {
    const userId = user._id;
    const userEmail = user.email;
    const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment().add(30, 'days').toDate();
    const tokenObject = new RefreshToken({
        token, userId, userEmail, expires,
    });
    tokenObject.save();
    return tokenObject;
}