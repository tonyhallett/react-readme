
import * as React from 'react';
export = {
  component:({color}:{color:string})=>{
    return <div style={{color:color}}>Coloured by props</div>
  },
  props:[[{color:'red'},{readme:'Red props'}],[{color:'orange'},{readme:'Orange props'}],[{color:'green'},{readme:'Green props'}]]
}