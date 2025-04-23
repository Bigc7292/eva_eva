```mermaid
flowchart TD
    N1[1: Start Call] --> N2[2: Assistant - Greeting]
    N2 --> N3[3: Gather - Good Time]
    N3 --> N4{4: Condition - Is Good Time?}
    
    %% Yes branch
    N4 -->|Yes| N5[5: Gather - Location]
    N5 --> N6[6: Gather - Property Type]
    N6 --> N7[7: Gather - Budget]
    N7 --> N8[8: Gather - Timeframe]
    N8 --> N9[9: Gather - Purpose]
    N9 --> N10[10: API - Check Properties]
    N10 --> N11{11: Condition - Properties Exist?}
    
    %% Properties exist branch
    N11 -->|Yes| N12[12: Gather - Preferred Time]
    N12 --> N13[13: API - Check Calendar]
    N13 --> N14{14: Condition - Slots Available?}
    
    %% Slots available branch
    N14 -->|Yes| N15[15: Say - Present Slots]
    N15 --> N16[16: Gather - Selected Slot]
    N16 --> N17[17: API - Book Slot]
    N17 --> N18{18: Condition - Booking Success?}
    
    %% Booking success branch
    N18 -->|Yes| N19[19: Gather - Full Name]
    N19 --> N20[20: Gather - Email]
    N20 --> N21[21: Say - Confirm Email]
    N21 --> N22[22: Gather - Email Confirmation]
    N22 --> N23{23: Condition - Email Correct?}
    
    %% Email correct branch
    N23 -->|Yes| N24[24: API - Create Lead]
    N24 --> N25[25: Say - Confirm Booking]
    N25 --> N26[26: End Call]
    
    %% Email incorrect branch
    N23 -->|No| N20
    
    %% Booking failed branch
    N18 -->|No| N34[34: Say - Booking Failed]
    N34 --> N15
    
    %% No slots available branch
    N14 -->|No| N33[33: Say - No Slots]
    N33 --> N12
    
    %% No properties branch
    N11 -->|No| N31[31: Say - No Properties]
    N31 --> N32[32: End Call - No Properties]
    
    %% Not a good time branch
    N4 -->|No| N27[27: Say - Better Time]
    N27 --> N28[28: Gather - Callback Time]
    N28 --> N29[29: Say - Confirm Callback]
    N29 --> N30[30: End Call - Callback]
    
    %% Style nodes by type
    classDef start fill:#d4f1f9,stroke:#05a,stroke-width:2px
    classDef assistant fill:#e1d5e7,stroke:#9673a6,stroke-width:1px
    classDef gather fill:#fff2cc,stroke:#d6b656,stroke-width:1px
    classDef condition fill:#f8cecc,stroke:#b85450,stroke-width:1px
    classDef api fill:#d5e8d4,stroke:#82b366,stroke-width:1px
    classDef say fill:#dae8fc,stroke:#6c8ebf,stroke-width:1px
    classDef end fill:#f5f5f5,stroke:#666,stroke-width:1px
    
    class N1 start
    class N2 assistant
    class N3,N5,N6,N7,N8,N9,N12,N16,N19,N20,N22,N28 gather
    class N4,N11,N14,N18,N23 condition
    class N10,N13,N17,N24 api
    class N15,N21,N25,N27,N29,N31,N33,N34 say
    class N26,N30,N32 end
```
