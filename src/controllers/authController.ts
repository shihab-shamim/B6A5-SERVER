import bcrypt from "bcryptjs";
import {  PrismaClient  } from "@prisma/client";
import {  generateToken  } from "../utils/auth";

const prisma = new PrismaClient();


const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please include all fields" });
    }

    
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration" });
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please include all fields" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login" });
  }
};


const getMe = async (req, res) => {
  try {
    const user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
    };
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};


const updateProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: req.body.name || user.name,
          avatar: req.body.avatar || user.avatar,
        },
      });

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        token: generateToken(updatedUser.id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

export { 
  registerUser,
  loginUser,
  getMe,
  updateProfile,
 };
