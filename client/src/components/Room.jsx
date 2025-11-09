import React from 'react'
import { useState } from 'react'
import '../App.css'
import Member from './Member'
import Editor from './Editor'


const Room = () => {
    const [members, setMembers] = useState([
        {socketId:1, username:"Prathamesh"},
        {socketId:2, username:"Sunny"},
        {socketId:1, username:"Prathamesh"},
        {socketId:2, username:"Sunny"},
    ])

  return (
    <div className='flex h-screen w-full'>
    {/* right side container for operations and members list */}
      <div className='h-full w-1/5 bg-zinc-900 border border-zinc-700 overflow-y-hidden'>
        <div className='h-1/12 flex justify-center'>
            <h1 className='title text-blue-50'>Collab</h1>
        </div>

        <div className='h-9/12 p-4 text-xl font-semibold text-blue-50 border-y border-zinc-700'>
            <h1 className='mb-1'>Members</h1>
            {/* members list */}
            <div className='flex max-h-105 flex-col overflow-y-auto'>
                {
                    members.map((member)=>{
                        return<Member key={member.socketId} username={member.username}/>
                    })
                }
            </div>
        </div>

        <div className='flex flex-col gap-2 p-3 items-center'>
            <button className="bg-blue-500 text-white w-auto px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer">
                    COPY ROOM ID
                </button>
            <button className="bg-blue-500 text-white w-auto px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer">
                    LEAVE ROOM
                </button>
        </div>
      </div>

    {/* left side conatiner for workspace*/}
      <div className='w-full h-screen overflow-y-auto'>
        <Editor/>
      </div>
    </div>
  )
}

export default Room
