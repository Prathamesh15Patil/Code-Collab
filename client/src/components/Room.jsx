import React, { useEffect } from 'react'
import { useState, useRef } from 'react'
import '../App.css'
import Member from './Member'
import Editor from './Editor'
import Output from './Output'
import { initSocket } from '../socket'
import {toast} from 'react-hot-toast'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import axios from 'axios'


const Room = () => {
  const [member, setMember] = useState([]);
  const socketRef = useRef(null);
  const codeRef = useRef(""); // Initialize with empty string
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  // New states for language and input
  const [selectedLanguage, setSelectedLanguage] = useState('java'); // Default language
  const [userInput, setUserInput] = useState(''); // State for user input
  const [output, setOutput] = useState("");


  useEffect(() => {
    const init = async () => {
      const handleError = (e) => {
        console.log("Socket Error : ", e);
        toast.error("Socket connection failed!");
        navigate("/idGenerator");
      }

      socketRef.current = await initSocket();
      
      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));
      
      // Emit join event with current username and roomId
      socketRef.current.emit('join', {
        roomId,
        username: location.state?.username,
      });

      // Listen for 'joined' event
      socketRef.current.on('joined',({clients,username,socketId, currentLanguage})=>{
        if(username !== location.state?.username){
          toast.success(`${username} joined`);
        }
        setMember(clients);
        // Sync code for new member
        socketRef.current.emit("sync-code", {
          socketId,
          code: codeRef.current
        });
        // Set the language if it's sent from the server (e.g., for new joins)
        if(currentLanguage) {
          setSelectedLanguage(currentLanguage);
        }
      });

      // New: Listen for language changes from other clients
      socketRef.current.on('language-change', ({ language }) => {
        setSelectedLanguage(language);
        toast.success(`Language changed to ${language}`);
      });

      // Listen for 'disconnected' event
      socketRef.current.on("disconnected",({socketId , username})=>{
        toast.success(`${username} left room`);
        setMember((prev)=>{
          return prev.filter(
            (member)=> member.socketId !== socketId
          )
        });
      });
    };
    init();

    // Cleanup function
    return ()=>{
      if(socketRef.current){
        socketRef.current.disconnect();
        socketRef.current.off("joined");
        socketRef.current.off("disconnected");
        socketRef.current.off("language-change"); // Cleanup new listener
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Redirect if username not found
  if(!location.state || !location.state.username){
    navigate("/idGenerator");
    return null; // Prevent rendering if redirecting
  }

  const copyRoomIdBtn = async ()=>{
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID is copied!")
    } catch (error) {
      toast.error("Unable to copy room ID!")
    }
  }

  const leaveRoomBtn = ()=>{
    navigate("/idGenerator")
  }

  const handleRun = async () => {
    setOutput("Running...");
    try {
      console.log("Running code:", codeRef.current, "Language:", selectedLanguage, "Input:", userInput);
      const res = await axios.post("http://localhost:3000/run", {
        code: codeRef.current,
        language: selectedLanguage, // Send selected language
        input: userInput,          // Send user input
      });
      setOutput(res.data.output);
    } catch (err) {
      console.error("Error during run:", err);
      setOutput(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  // New handler for language change dropdown
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    if(socketRef.current) {
      socketRef.current.emit("language-change", { roomId, language: newLanguage });
    }
  };

  return (
    <div className='flex h-screen w-full'>
      {/* left side container for operations and member list */}
      <div className='h-auto w-1/5 bg-zinc-900 border border-zinc-700 overflow-y-hidden'>
        <div className='h-1/12 flex justify-center'>
          <h1 className='title text-blue-50'>Collab</h1>
        </div>

        <div className='h-8/12 p-4 text-xl font-semibold text-blue-50 border-y border-zinc-700'>
          <h1 className='mb-1'>Member</h1>
          {/* member list */}
          <div className='flex max-h-105 flex-col overflow-y-auto'>
            {
              member.map((m) => { // Changed variable name from 'member' to 'm' to avoid conflict with state variable
                return <Member key={m.socketId} username={m.username} />
              })
            }
          </div>
        </div>

        <div className='flex flex-col gap-2 p-3 items-center'>
          {/* Language Selector */}
          <select
            className="bg-zinc-800 text-white w-auto px-4 py-2 rounded-lg border border-zinc-700 focus:outline-none"
            value={selectedLanguage}
            onChange={handleLanguageChange}
          >
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>

          <button onClick={copyRoomIdBtn} className="bg-blue-500 text-white w-auto px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer">
            COPY ROOM ID
          </button>
          <button onClick={leaveRoomBtn} className="bg-blue-500 text-white w-auto px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer">
            LEAVE ROOM
          </button>
        </div>
      </div>

      {/*right side container for workspace*/}
      <div className='w-full h-screen overflow-y-auto'>
        <Editor
          socketRef = {socketRef}
          roomId={roomId}
          onCodeChange = {(code)=>{
            codeRef.current = code;
          }}
          language={selectedLanguage} // Pass selected language to Editor
        />
        <div className="flex flex-col gap-2 p-4 bg-gray-900 text-white border-t border-zinc-700">
          <label htmlFor="userInput" className="text-lg font-semibold text-blue-50">Input (Provide all inputs upfront, one per line):</label>
          <textarea
            id="userInput"
            className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded p-2 focus:outline-none resize-y"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your program's input here (e.g., 5&#10;hello&#10;world)"
          ></textarea>
          <button
            onClick={handleRun}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer self-start"
          >
            Run Code
          </button>
        </div>
        <br></br>
        <div className='w-full h-screen overflow-y-auto bg-gray-900 text-white'>
          <Output output={output}/>
        </div>
      </div>
    </div>
  )
}

export default Room