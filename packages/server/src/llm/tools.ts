const tools = [
  {
    type: "function",
    function: {
      name: "emit_build",
      description: "Devuelve la build recomendada en el formato pactado",
      strict: true, // <- Structured Outputs ON
      parameters: {
        type: "object",
        properties: {
          version: { type: "string", enum: ["1.0"] },
          patch: { type: "string" },
          hero: { type: "string" },
          role: { type: "string", enum: ["Mid","Offlane","Hard Carry","Support","Hard Support"] },
          phase: { type: "string", enum: ["early","mid","late"] },
          threats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hero: { type: "string" },
                type: { type: "string", enum: ["magic","physical","control","push","global","sustain"] },
                score: { type: "number" },
                note: { type: "string" }
              },
              required: ["hero","type","score","note"],
              additionalProperties: false
            }
          },
          item_build: {
            type: "object",
            properties: {
              starting: { type: "array", items: objItemWhy() },
              early:    { type: "array", items: objItemWhy() },
              core: {
                type: "array",
                items: {
                  type: "object",
                  properties: { item: {type:"string"}, why:{type:"string"}, priority: { type:"integer", minimum:1, maximum:3 } },
                  required: ["item","why","priority"], additionalProperties:false
                }
              },
              situational: { type: "array", items: { type:"object", properties:{ item:{type:"string"}, why:{type:"string"}, when:{type:"string"} }, required:["item","why","when"], additionalProperties:false } },
              consumables: { type: "array", items: { type:"string" } }
            },
            required: ["starting","early","core","situational","consumables"],
            additionalProperties: false
          },
          facet_recommendation: { type:"object", properties:{ facet:{type:"string"}, why:{type:"string"} }, required:["facet","why"], additionalProperties:false },
          skill_build: {
            type:"object",
            properties:{
              order: { type:"array", items: { type:"string" } },
              talents: { type:"array", items: { type:"object", properties:{ level:{type:"integer"}, pick:{type:"string"}, why:{type:"string"} }, required:["level","pick","why"], additionalProperties:false } }
            },
            required:["order","talents"], additionalProperties:false
          },
          live_adjustments: { type:"array", items:{ type:"object", properties:{ minute_gte:{type:"integer"}, change:{type:"string"}, reason:{type:"string"} }, required:["minute_gte","change","reason"], additionalProperties:false } },
          playstyle_tips: { type:"array", items:{ type:"object", properties:{ focus:{type:"string"}, tip:{type:"string"} }, required:["focus","tip"], additionalProperties:false } },
          confidence: { type:"number" }
        },
        required: ["version","patch","hero","role","phase","threats","item_build","facet_recommendation","skill_build","live_adjustments","playstyle_tips","confidence"],
        additionalProperties: false
      }
    }
  }
];

function objItemWhy() {
  return { type:"object", properties:{ item:{type:"string"}, why:{type:"string"} }, required:["item","why"], additionalProperties:false };
}

export { tools };
