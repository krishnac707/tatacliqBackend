import UserModal from '../modal/User.modal.js';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

export const Register = async (req,res) => {
    try{
        const {userData} = req.body;
        // console.log(userData, "userdata");
        const { name, email, password, role } = userData;
        if (!name || !email || !password || !role) return res.json({ success: false, message: "All fields are mandetory..." })

        const isEmailExist = await UserModal.find({ email: email })
        if (isEmailExist.length) {
            return res.json({ success: false, message: "Email already Exist" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = new UserModal({ name, email, password: hashPassword, role });
        await user.save();

        return res.json({ success: true, message: "Registration Successful" })
    }catch(error){
        return res.json({ success: false, message: error })
    }
}

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body.userData;
        if (!email || !password) return res.json({ success: false, message: "please fill all details" });

        const user = await UserModal.findOne({ email });
        if (!user) return res.json({ success: false, message: "User not found" })
        if (user.isBlocked) return res.status(404).json({ success: false, message: "Your account is  blocked by admin please contact with us to login" })
        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {
            const userobj = {
                name: user.name,
                email: user.email,
                userId: user._id
            }

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            return res.json({ success: true, message: "Login Successful", user: userobj, token: token })
        }
        return res.json({ success: false, message: "please check email or password" })

    }
    catch (error) {

    }
}

export const getCurrentUser = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) return res.status(404).json({ success: false, message: "token is required" })
        const decoder = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoder) return res.status(404).json({ success: false, message: "Not a valid token" })

        const userid = decoder?.userId
        const user = await UserModal.findById(userid)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        const userObj = {
            name: user?.name,
            email: user?.email,
            _id: user?._id
        }
        return res.status(200).json({ success: true, user: userObj })

    } catch (error) {
        return res.status(500).json({ success: false, message: error })
    }
}