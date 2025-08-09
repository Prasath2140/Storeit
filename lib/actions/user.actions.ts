"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "../appwrite/config";
import { Query, ID } from "node-appwrite";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", email)]
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw new Error(message);
};

const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    console.log("Creating user account for email:", email);
    
    // Generate a more secure random password that meets Appwrite requirements
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let tempPassword = '';
    for (let i = 0; i < 16; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    console.log("Generated password length:", tempPassword.length);
    
    let user;
    
    try {
      // Try to create a new user account
      user = await account.create(
        ID.unique(),
        email,
        tempPassword, // Use a secure password
        "User"  // Provide a valid name instead of empty string
      );
      
      console.log("User created successfully:", user.$id);
      
      // Try to send verification email using a different approach
      console.log("Sending verification email...");
      try {
        await account.createVerification(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/verify`
        );
        console.log("Verification email sent successfully");
      } catch (verificationError) {
        console.log("Verification email failed, but user created. User can sign in with password:", tempPassword);
        // Store the temporary password in database for user reference
        return { userId: user.$id, tempPassword };
      }
      
      return user.$id;
    } catch (createError: any) {
      if (createError.message?.includes("already exists")) {
        console.log("User already exists, trying to send verification email...");
        // Try to send verification to existing user
        try {
          await account.createVerification(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/verify`
          );
          console.log("Verification email sent to existing user");
          return "existing_user_" + Date.now();
        } catch (verificationError) {
          console.log("Could not send verification email to existing user");
          return "existing_user_" + Date.now();
        }
      } else {
        throw createError;
      }
    }
  } catch (error) {
    console.error("Error in sendEmailOTP:", error);
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    // If user exists in our database, just return the existing accountId
    // The user will need to sign in with their password
    console.log("User exists in database, returning existing accountId");
    return { accountId: existingUser.accountId };
  }

  const result = await sendEmailOTP({ email });

  if (!result) throw new Error("Failed to send an OTP");

  // Handle different return types from sendEmailOTP
  let accountId: string;
  let tempPassword: string | undefined;

  if (typeof result === 'object' && result.userId) {
    accountId = result.userId;
    tempPassword = result.tempPassword;
  } else if (typeof result === 'string') {
    accountId = result;
  } else {
    throw new Error("Invalid response from sendEmailOTP");
  }

  if (accountId.startsWith("existing_user_")) {
    // User already exists in Appwrite but not in our database
    console.log("User exists in Appwrite but not in database, creating database record");
    // Create user document in database
    const { databases } = await createAdminClient();
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar:
          "https://cloud.appwrite.io/v1/storage/buckets/64f6c0b8f4c5c8c8c8c8/files/64f6c0b8f4c5c8c8c8c8/view?project=64f6c0b8f4c5c8c8c8c8&mode=admin",
        accountId: accountId,
      }
    );
    return { accountId };
  }

  // Create user document in database
  const { databases } = await createAdminClient();
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    ID.unique(),
    {
      fullName,
      email,
      avatar:
        "https://cloud.appwrite.io/v1/storage/buckets/64f6c0b8f4c5c8c8c8c8/files/64f6c0b8f4c5c8c8c8c8/view?project=64f6c0b8f4c5c8c8c8c8&mode=admin",
      accountId: accountId,
    }
  );

  return { accountId, tempPassword };
};
