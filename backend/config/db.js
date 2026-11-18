import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://shaikhrihan2944_db_user:zLpZIPyPzeHJMYM4@cluster0.quxwopl.mongodb.net/food_os').then(()=>console.log("DB Connected"));
}