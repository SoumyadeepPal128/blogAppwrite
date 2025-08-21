import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button, Select, Input, RTE } from "../index";
import appwriteService from "../../appwrite/config";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function PostForm({ post }) {
    const { register, handleSubmit, watch, setValue, control, getValues } =
        useForm({
            defaultValues: {
                title: post?.title || "",
                slug: post?.slug || "",
                content: post?.content || "",
                status: post?.status || "active",
            },
        });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth?.userData);

    const submit = async (data) => {
    //
    // --- START: RECOMMENDED FIX ---
    //
    
    // Guard Clause: Check if userData exists before doing anything else.
    if (!userData) {
        console.error("User is not logged in or user data is not available. Aborting post creation.");
        // Optionally, you can set an error state here to show a message to the user.
        return; // Stop the function execution
    }

    // For debugging, you can log the data here to be certain
    console.log("User data available:", userData);
    const idd=userData.$id;
    //
    // --- END: RECOMMENDED FIX ---
    //

    // This is the logic for UPDATING an existing post
    if (post) {
        const file = data.image[0]
            ? await appwriteService.uploadFile(data.image[0]) // Added await here, uploadFile is async
            : null;

        if (file) {
            appwriteService.deleteFile(post.featuredImage);
        }

        const dbPost = await appwriteService.updatePost(post.$id, {
            ...data,
            featuredImage: file ? file.$id : undefined,
        });

        if (dbPost) {
            navigate(`/post/${dbPost.$id}`);
        }
    }
    // This is the logic for CREATING a new post
    else {
        // Important: Ensure there is an image to upload, as this is required for a new post in your logic
        if (!data.image || data.image.length === 0) {
            console.error("Featured image is required to create a new post.");
            // You can set an error state to inform the user
            return;
        }

        const file = await appwriteService.uploadFile(data.image[0]);

        if (file) {
            const fileId = file.$id;
            data.featuredImage = fileId;
            console.log(`${userData.$id}`);
            
            const dbPost = await appwriteService.createPost({
                ...data,
                userId: idd, // This will now safely execute
            });
            
            if (dbPost) {
                navigate(`/post/${dbPost.$id}`);
            }
        }
    }
};

    const slugTransform = useCallback((value) => {
        if (value) {
            return value
                .trim()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-");
        }
    }, []);

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title, { shouldValidate: true }));
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { required: true })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { required: true })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), {
                            shouldValidate: true,
                        });
                    }}
                />
                <RTE
                    label="Content :"
                    name="content"
                    control={control}
                    defaultValue={getValues("content")}
                />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { required: !post })}
                />
                {post && (
                    <div className="w-full mb-4">
                        <img
                            src={appwriteService.getFilePreview(post.featuredImage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: true })}
                />
                <Button
                    type="submit"
                    bgColor={post ? "bg-green-500" : undefined}
                    className="w-full"
                >
                    {post ? "Update" : "Submit"}
                </Button>
            </div>
        </form>
    );
}

export default PostForm;
