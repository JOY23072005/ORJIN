import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  signInAnonymously 
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRoom } from "./RoomContext";

type User = {
  uid: string;
  email?: string | null;
  name?: string | null;
  isAnonymous?: boolean;
};

type UserContextType = {
  user: User | null;
  isAuthenticated: boolean;
  guest: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const {setJoinedRooms} = useRoom();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "Users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: docSnap.exists() ? docSnap.data().name : null,
            isAnonymous: firebaseUser.isAnonymous,
          });
        } catch (e) {
          console.error("Error fetching user doc:", e);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: null,
            isAnonymous: firebaseUser.isAnonymous,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const guest = async (): Promise<boolean> => {
    try {
      await signInAnonymously(auth);
      return true;
    } catch (error) {
      console.error("Guest login error:", error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setJoinedRooms([]);//cleanup
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false); 
    }
  };



  const value: UserContextType = {
    user,
    isAuthenticated: !!user && !user.isAnonymous,
    guest,
    login,
    logout,
    loading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
