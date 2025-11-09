import React from 'react'
import Avatar from 'react-avatar'

const Member = ({username}) => {
  return (
    <div className='flex items-center my-1 gap-2'>
      <Avatar name={username.toString()} size={50} round="14px"/>
      <span className='text-lg'>{(username.toString()).toUpperCase()}</span>
    </div>
  )
}

export default Member
