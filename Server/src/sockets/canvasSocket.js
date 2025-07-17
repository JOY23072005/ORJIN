import * as Y from 'yjs';

export default function canvasSocketHandler(io){
    io.on("connection",(socket)=>{
        socket.on("canvas-update",()=>{
            console.log("Canvas Updated")
        })
    })
}