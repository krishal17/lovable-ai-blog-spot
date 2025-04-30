
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export type BlogPost = {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: Date | number;
}

const BLOGS_COLLECTION = "blogs";

// Create a new blog post
export const createBlogPost = async (blogData: Omit<BlogPost, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, BLOGS_COLLECTION), {
      ...blogData,
      createdAt: new Date().getTime()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding blog:", error);
    throw new Error("Failed to create blog post");
  }
};

// Get all blog posts
export const getAllBlogPosts = async () => {
  try {
    const q = query(collection(db, BLOGS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BlogPost[];
  } catch (error) {
    console.error("Error getting blogs:", error);
    throw new Error("Failed to fetch blog posts");
  }
};

// Get a single blog post by ID
export const getBlogPostById = async (id: string) => {
  try {
    const docRef = doc(db, BLOGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BlogPost;
    } else {
      throw new Error("Blog post not found");
    }
  } catch (error) {
    console.error("Error getting blog:", error);
    throw error;
  }
};

// Update a blog post
export const updateBlogPost = async (id: string, blogData: Partial<BlogPost>) => {
  try {
    const blogRef = doc(db, BLOGS_COLLECTION, id);
    await updateDoc(blogRef, blogData);
    return true;
  } catch (error) {
    console.error("Error updating blog:", error);
    throw new Error("Failed to update blog post");
  }
};

// Delete a blog post
export const deleteBlogPost = async (id: string) => {
  try {
    await deleteDoc(doc(db, BLOGS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw new Error("Failed to delete blog post");
  }
};

// Get blog posts by category
export const getBlogPostsByCategory = async (category: string) => {
  try {
    const q = query(
      collection(db, BLOGS_COLLECTION), 
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BlogPost[];
  } catch (error) {
    console.error("Error getting blogs by category:", error);
    throw new Error("Failed to fetch blog posts by category");
  }
};

// Get all categories
export const getAllCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, BLOGS_COLLECTION));
    const categories = new Set<string>();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    return Array.from(categories);
  } catch (error) {
    console.error("Error getting categories:", error);
    throw new Error("Failed to fetch categories");
  }
};
