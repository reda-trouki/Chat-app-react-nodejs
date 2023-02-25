import { ArrowBackIcon, AttachmentIcon } from '@chakra-ui/icons';
import { Box, Button, IconButton, Img, InputGroup, InputLeftElement, InputRightElement, Text } from '@chakra-ui/react';
import React, { useState } from 'react'
import { getSender, getSenderFull } from '../config/ChatLogics';
import { ChatState } from '../Context/ChatProvider'
import ProfileModal from './Authentication/miscellaneous/ProfileModel';
import UpdateGroupChatModal from './Authentication/miscellaneous/UpdateGroupChatModal';
import {Spinner, FormControl,Input, useToast} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect } from 'react';
import './style.css';
import ScrollableChat from './ScrollableChat';
import io from 'socket.io-client';
import Lottie from 'react-lottie';
import animationData from '../animations/typing.json';
import { BsEmojiSmile } from 'react-icons/bs';
import Picker from 'emoji-picker-react';
import { storage } from '../firebase.js';
import { ref, uploadBytesResumable,getDownloadURL } from 'firebase/storage';

const ENDPOINT = "http://localhost:5000";
var socket,selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain}) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState();
    const toast = useToast();
    const { user, selectedChat, setSelectedChat, notifications, setNotifications } = ChatState();
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTiping] = useState(false);
    const [istyping, setIsTiping] = useState(false);
    const [pick,setPick] = useState(false);
    const [chosenEmoji,setChosenEmoji] = useState(null);
    const [progress,setProgress] = useState();
    const [type,SetType] = useState("String");
    const [image,setImage] = useState();
    const [fileUrl,setFileUrl] = useState();
    const defaultOptions = {
      loop:true,
      autoplay:true,
      animationData: animationData,
      renderSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };
  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      
      setMessages(data);
      setLoading(false);
      socket.emit("join chat",selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

useEffect(() => {
   socket = io(ENDPOINT);
   socket.emit("setup",user);
   socket.on("connected", () => setSocketConnected(true));
   socket.on("typing",()=>setIsTiping(true))
   socket.on("stop typing",()=>setIsTiping(false));
}, [])
    useEffect(() => {
      fetchMessages();

      selectedChatCompare=selectedChat;
    }, [selectedChat]);
     useEffect(() => {
       socket.on("message received",(newMessageReceived) =>{
         if(!selectedChatCompare || selectedChatCompare._id!== newMessageReceived.chat._id ){
           if(!notifications.includes(newMessageReceived)){
             setNotifications([newMessageReceived,...notifications]);
             setFetchAgain(!fetchAgain);
           }
         } else{
           setMessages([...messages,newMessageReceived]);
         }
       })
     })
     

    const sendMessage = async (event) =>{
        if(event.key === "Enter" && newMessage){
          SetType('String')
          socket.emit("stop typing",selectedChat._id);
            try {
                const config = {
                    headers: {
                        "Content-type":"application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                setNewMessage("");
                const { data } = await axios.post("/api/message",{
                    content: newMessage,
                    type: type,
                    chatId: selectedChat._id,
                },config);
                // console.log(data);
                socket.emit("new message",data);
                setMessages([...messages,data]);
            } catch (error) {
                toast({
                    title: "Error occured!",
                    descreption: "Failed to send the message",
                    status:"error",
                    duration:5000,
                    isClosable:true,
                    position:"bottom",

                });
            }
        }
    };



    const typingHandler = (e) =>{
        setNewMessage(e.target.value);

        //typing Indicator logic

        if(!socketConnected) return;
        if(!typing){
          setTiping(true);
          socket.emit("typing",selectedChat._id);
        }

        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;

            if(timeDiff >= timerLength){
              socket.emit("stop typing",selectedChat._id);
              setTiping(false);
            }
        }, timerLength);
    };

    const onEmojiClick = (event,emojiObject) =>{
      setChosenEmoji(emojiObject);
      if(!newMessage) {
        setNewMessage(emojiObject.emoji);
      } else {
        setNewMessage(newMessage+emojiObject.emoji);
      }
      
    
    };
    const sendImage = async () =>{
      if(image){
        
      try {
        const config = {
          headers: {
            "Content-type":"application/json",
             Authorization: `Bearer ${user.token}`,
            },
          };

          setImage("");
          const { data } = await axios.post("/api/message",{
              content: image,
              type: type,
              chatId: selectedChat._id,
            },config);
            // console.log(data);
            socket.emit("new message",data);
            setMessages([...messages,data]);
            SetType('String');
            } catch (error) {
                toast({
                    title: "Error occured!",
                    descreption: "Failed to send the image",
                    status:"error",
                    duration:5000,
                    isClosable:true,
                    position:"bottom",

                });
            }
            }
            
    };
    const postDetails = async (pics) => {
      
        if(pics === undefined){
           toast({
             title:"Please Select an Image!",
             status:"warning",
             duration: 5000,
             isClosable:true,
             position: "bottom",

           });
           return;
        }
        console.log(pics);
        if(pics.type === "image/jpeg" || pics.type === "image/png"){
          SetType('Image');
          const data = new FormData();
          data.append("file",pics);
          data.append("upload_preset","chat-app");
          data.append("cloud_name","reda-tr");
          fetch("https://api.cloudinary.com/v1_1/reda-tr/image/upload",{
            method: "post",
            body: data,
          })
          .then((res) => res.json())
          .then((data) => {
            setImage(data.url.toString());
            console.log(data.url.toString());
            
             })
             .catch((err) => {
               console.log(err);
               
             });
              
             
        } else {
          toast({
            title: "Please Select an Image !",
            status:"warning",
            duration:5000,
            isClosable:true,
            position: "bottom",
          });
          return;
        }
    };
   const cancelImage = () => {
     setImage("");
     SetType('String')
   };

   const sendFile = async () =>{
     if(fileUrl){
        
      try {
        const config = {
          headers: {
            "Content-type":"application/json",
             Authorization: `Bearer ${user.token}`,
            },
          };

          setFileUrl("");
          const { data } = await axios.post("/api/message",{
              content: fileUrl,
              type: type,
              chatId: selectedChat._id,
            },config);
            // console.log(data);
            socket.emit("new message",data);
            setMessages([...messages,data]);
            console.log("Url ",fileUrl);
            SetType('String');
            } catch (error) {
                toast({
                    title: "Error occured!",
                    descreption: "Failed to send the File",
                    status:"error",
                    duration:5000,
                    isClosable:true,
                    position:"bottom",

                });
            }
            }
   }
   const uploadFiles = async (file) =>{
      if(!file) return;
      const storageRef = ref(storage,`/files/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef,file);

      uploadTask.on("state_changed",(snapshot) =>{
        const prog = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(prog);
      },(err) => console.log(err), 
      () =>{
        getDownloadURL(uploadTask.snapshot.ref)
        .then((url) => {
          setFileUrl(url.toString());
          
        })
      } 
      );
        SetType("File");
        await sendFile();
      
   };
   
  return (
    <>
    {
        selectedChat ? (
            <>
            <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
            >
              <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
                <>
                {getSender(user,selectedChat.users)}
                <ProfileModal user={getSenderFull(user,selectedChat.users)}/>
                </>
            ) : (
                <>
                 {selectedChat.chatName.toUpperCase()}
                 <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                 />
                </>
            )}
            </Text>
           
            <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            >
            {loading ? (
                <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
                />

            ) : (
              
              
                <div className="messages">
                  {image ?<Box
                            
                          >
                    <Img src={image} alt='image' width="100%" height="80%"/>
                    <Button onClick={sendImage}>Send Image</Button>
                    <Button onClick={cancelImage}>Cancel</Button>
                  </Box> : 
                  <ScrollableChat messages={messages} />
                  }
                    
                </div>
                

                
            )}
            <Box display='flex'>
            <FormControl onKeyDown={sendMessage} isRequired mt={3} >
              {istyping ? <div>
                <Lottie 
                options={defaultOptions}
                width={70}
                style={{ marginBottom:15, marginLeft:0 }}
                />
              </div> : <></>}
             { pick ? <Picker onEmojiClick={onEmojiClick} native={true}/>
              : <></> 
            }
              <InputGroup>
                  <InputLeftElement>
                    
                      <BsEmojiSmile style={{cursor:'pointer'}} onClick={() => setPick(!pick)}/>
                    
                  </InputLeftElement>
                <Input
                w='200%'
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter message..."
                onChange={typingHandler}
                value={newMessage}
                />
                </InputGroup>
            </FormControl>
            <FormControl d={{base:'block',md:'flex'}}w='5%' position='relative' top='30%' alignItems='center'>
              <InputLeftElement w='50%' >
              <label htmlFor='upload_image' style={{cursor:'pointer'}}><i class="fas fa-image"></i></label>
              <Input type='file' id='upload_image' accept="image/png, image/gif, image/jpeg" onChange={(e) => postDetails(e.target.files[0])} hidden/>
              </InputLeftElement>
              <InputRightElement w='50%'>
              <label htmlFor='upload_file' style={{cursor:'pointer'}}><AttachmentIcon /></label>
              <Input type='file' id='upload_file' onChange={(e) => uploadFiles(e.currentTarget.files[0])} hidden/>
              </InputRightElement>
            </FormControl>
            </Box>
            </Box>
            
            </>
        ) : (
            <Box d="flex" alignItems="center" justifyContent="center" h="100%" >
                <Text fontSize="3xl" pb={3} fontFamily="Work sans">
                   Click on a user to start chatting
                </Text>
            </Box>
        )
    }
    </>
  )
}

export default SingleChat