import { UtxoOrderInfo } from "./parameters";
export const exampleOrdersInfo: UtxoOrderInfo[] =
    [
        {
            txHash: 'b46c29e3acd5433a8ec01095eaa8debb493e29bd0288fa881a859f036c3f0e94',
            txOutRef: 0,
            sender:
                'addr_test1qz2dw3mzu5s8n4gcqgyl7ftrd4wxsdc8cy3ec0dlldn3yj8ln0q07h5njcrw39h3y4yelnaqn0ah0ysk65g6rgs55dxsuy2365',
            sAmount: 1,
            sAsset: [
                '0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005', '746f6b656e41'
            ],
            rAmount: 1,
            rAsset: [
                '0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005', ''
            ],
            consumed: false
        },
        {
            txHash: 'c143801ce2bcfb801afb85dac165651e0eb75bd424df494f71bf8bd2746af886',
            txOutRef: 0,
            sender:
                'addr_test1qpdkmcd7yx8tkd0upzefs036r4e2ajtferf2vvqjzt3w4x3flr6kcwyx4uy4u6eyz0apc85pml3hxyrf9rktuwxuunwqqjr5a0',
            sAmount: 12345,
            sAsset: [
                '0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005', '746f6b656e41'
            ],
            rAmount: 10000,
            rAsset: [
                '0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005', '746f6b656e42'
            ],
            consumed: false
        },
        {
            txHash: 'c052446d97a5588aa8d73f80da81151a5861fd5b956fa1ed6573f2b4395d7f1a',
            txOutRef: 0,
            sender:
                'addr_test1qz2dw3mzu5s8n4gcqgyl7ftrd4wxsdc8cy3ec0dlldn3yj8ln0q07h5njcrw39h3y4yelnaqn0ah0ysk65g6rgs55dxsuy2365',
            sAmount: 12000,
            sAsset: ['', ''],
            rAmount: 2000,
            rAsset: [
                '0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005', '746f6b656e42'
            ],
            consumed: false
        },
        {
            txHash: 'c052446d97a5588aa8d73f80da81151a5861fd5b956fa1ed6573f2b4395d7f1a',
            txOutRef: 1,
            sender:
                'addr_test1qz2dw3mzu5s8n4gcqgyl7ftrd4wxsdc8cy3ec0dlldn3yj8ln0q07h5njcrw39h3y4yelnaqn0ah0ysk65g6rgs55dxsuy2365',
            sAmount: 3000,
            sAsset: ['', ''],
            rAmount: 150000,
            rAsset: [
                '', ''
            ],
            consumed: false
        },

    ]
