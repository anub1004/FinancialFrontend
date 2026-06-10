import { useEffect, useState } from "react";

function NewsComponent({id, data}: any) {
    console.log("NewsComponent rendered with id:", id);
    return (
        <li key={id}>
            <h2>{data.title}</h2>
            <p>{data.summary}</p>
            <a href={data.url} target="_blank" rel="noopener noreferrer">Read more</a>
        </li>
    );
    
   
  
}
export default NewsComponent;   
