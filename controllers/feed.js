const fs=require('fs');
const path=require('path');

const {validationResult}=require('express-validator/check');

const Post=require('../models/post');
const User=require('../models/user');

exports.getPosts=(req,res,next)=>{
const currentPage=req.query.page || 1;
const perPage=2;
let totalItems;
Post.find().countDocuments().then(count=>{
    totalItems=count;
  return  Post.find().skip((currentPage-1)*perPage).limit(perPage);
}).then(posts=>{
    res.status(200).json({message:'Fethced posts succesfully',posts:posts,totalItems:totalItems});
}).catch(err=>{
    if (!err.statusCode) {
        err.statusCode=500;
    }
     next(err); 
})
  
    // res.status(200).json({
    //     posts:[{
    //         _id:'1',
    //     title:'First',
    //     content:'This is the first post',
    //     imageUrl:'images/me.jpg',
    //     creator:{
    //         name:'Mete'
    //     },
    //     createdAt:new Date()
    // }]
    // });
};

exports.createPost=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const error=new Error('Validation failed, entered data is incorrect');
        error.statusCode=422;
        throw error;
        // return res.status(422).json({message:'Validation failed, entered data is incorrect',errors:errors.array()})
    }
    if (!req.file) {
        const error=new Error('No ,mage provided');
        error.statusCode=422;
        throw error;
    }
    const imageUrl=req.file.path;
    const title=req.body.title;
    const content=req.body.content; 
    let creator;

    const post=new Post({
        title:title,
        content:content,
        imageUrl:imageUrl,
        creator:req.userId,
    });
    post.save().then(result=>{
      return  User.findById(req.userId);
    }).then(user=>{
        creator=user;
        user.posts.push(post);//we are pushind 'post' data into users 'posts'
        return user.save();
    
    }).then(result=>{
        //Create post in db
        res.status(201).json({
            message:'Post created succesfully',
            post:post,
            creator:{_id:creator._id,name:creator.name}
        });
    }).catch(err=>{
       if (!err.statusCode) {
           err.statusCode=500;
       }
        next(err); 
    });
    // console.log(title,content);
    
};

exports.getPost=(req,res,next)=>{
    const postId=req.params.postId;//postId has to match with feed.js post/:postId
    Post.findById(postId).then((post)=>{
        if (!post) {
            const error=new Error('Could not find post');
            error.statusCode=404;
            throw error;
        }
        res.status(200).json({message:'Post fetched',post:post});
    }).catch(err=>{
        if (!err.statusCode) {
            err.statusCode=500;
        }
         next(err); 
    });
}

exports.updatePost=(req,res,next)=>{
    const postId=req.params.postId;
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const error=new Error('Validation failed, entered data is incorrect');
        error.statusCode=422;
        throw error;
        // return res.status(422).json({message:'Validation failed, entered data is incorrect',errors:errors.array()})
    }
    const title=req.body.title;
    const content=req.body.content;
    let imageUrl=req.body.image;
    if (req.file) {
        imageUrl=req.file.path;
    }
    if (!imageUrl) {
        const error=new Error('No file picked');
        error.statusCode=422;
        throw error
    }
    Post.findById(postId).then(post=>{
        if (!post) {
            const error=new Error('Could not find post');
            error.statusCode=404;
            throw error;
        }
        if(post.creator.toString()!==req.userId){
            const error=new Error('Not Authorized');
            error.statusCode=403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title=title;
        post.imageUrl=imageUrl;
        post.content=content;
        return post.save();
    }).then(result=>{
        res.status(200).json({message:'Post Updated',posts:result})
    }).catch(err=>{
        if (!err.statusCode) {
            err.statusCode=500;
        }
         next(err); 
    });
};

exports.deletePost=(req,res,next)=>{
    const postId=req.params.postId;
    Post.findById(postId).then(post=>{
        if (!post) {
            const error=new Error('Could not find post');
            error.statusCode=404;
            throw error;
        }
        if(post.creator.toString()!==req.userId){
            const error=new Error('Not Authorized');
            error.statusCode=403;
            throw error;
        }
        //Check logged in user
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    }).then(result=>{
        User.findById(req.userId);
        
    }).then(user=>{
        user.posts.pull(postId);
        return user.save()
       
    }).then(result=>{
        res.status(200).json({message:'Deleted Post'});
    }

    ).catch(err=>{
        if (!err.statusCode) {
            err.statusCode=500;
        }
        next();
    });

}

const clearImage=filePath=>{
    filePath=path.join(__dirname,'..',filePath);
    fs.unlink(filePath,err=>console.log(err));
}