import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

const BARBER_EMAIL = 'bushatia777@gmail.com';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail || userEmail !== BARBER_EMAIL) {
      return NextResponse.json({ error: 'Access denied. Barber only.' }, { status: 403 });
    }

    const supabase = await createClient();
    
    // Get all unique conversations involving the barber
    const { data, error } = await supabase
      .from('messages')
      .select('room_name, sender_email, sender_name, content, created_at')
      .like('room_name', 'chat:%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Group messages by room and get the latest message for each conversation
    const conversationsMap = new Map();
    
    data?.forEach((message) => {
      const roomName = message.room_name;
      
      if (!conversationsMap.has(roomName)) {
        // Extract client email from room name (format: chat:email1|email2)
        const emails = roomName.replace('chat:', '').split('|') as string[];
        const clientEmail = emails.find(email => email !== BARBER_EMAIL);
        
        // Find the client's name from any message they sent in this conversation
        const clientMessage = data?.find(msg => 
          msg.room_name === roomName && msg.sender_email === clientEmail
        );
        const clientName = clientMessage?.sender_name || clientEmail?.split('@')[0] || 'Client';
        
        conversationsMap.set(roomName, {
          roomName,
          clientEmail,
          clientName,
          lastMessage: message.content,
          lastMessageTime: message.created_at,
          lastSender: message.sender_email,
        });
      }
    });

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}