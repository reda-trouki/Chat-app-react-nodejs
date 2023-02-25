import React from 'react'
import {
  Container, 
  Box, 
  Text, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel
} from '@chakra-ui/react';
import Login from '../components/Authentication/Login';
import SignUp from '../components/Authentication/SignUp';
import { useNavigate as useHistory } from 'react-router-dom';
import { useEffect } from 'react';
const Homepage = () => {
    const history = useHistory();
    useEffect(() => {
      const user = JSON.parse(localStorage.getItem("userInfo"));
      if(user){
         history("/chats");
      }
    }, [history]);


  return (
    <Container maxW='xl' centerContent>
      <Box
       d="flex"
       justifyContent="center"
       p={3}
       bg={"white"}
       w="100%"
       m="40px 0 15px 0"
       borderRadius="lg"
       borderWidth="1px"
      >
        <Text fontSize='4xl' fontFamily="Work sans" color="black">Talk-Directly</Text>
      </Box>
      <Box
        p={4}
        bg={"white"}
        w="100%"
        borderRadius="lg"
        borderWidth="1px"
        color="black"
      >
       <Tabs variant='soft-rounded' >
         <TabList mb="1em">
            <Tab width="50%">Login</Tab>
            <Tab width="50%">Sign Up</Tab>
          </TabList>
          <TabPanels>
           <TabPanel>
              <Login/>
           </TabPanel>
           <TabPanel>
              <SignUp/>
          </TabPanel>
          </TabPanels>
        </Tabs>  
      </Box>
    </Container>
  )
}

export default Homepage